// Fallback geometry source for legacy parts that have no original DXF in Storage.
//
// The stored `svgPath` (lib/dxf/to-svg.ts) is lossy: it is Y-flipped (SVG is Y-down)
// and its arcs/splines are already approximations. We therefore:
//   * un-mirror it by negating Y (a reflection about the X axis); the constant offset
//     is irrelevant because `placeEntities` re-normalises to the part's bbox origin,
//   * flatten every curve (A/Q/C) into short straight segments — correctness over
//     fidelity for this secondary path. The primary path (parseOriginalDxfToEntities)
//     preserves true curves.
// This keeps legacy sheets cuttable (right outline, position, rotation, no mirroring)
// while the operator is advised to prefer parts that carry an original DXF.

import type { ExportEntity, ExportPoint, ExportVertex } from "./dxf-entities";

const TWO_PI = Math.PI * 2;

interface Cursor {
  tokens: string[];
  i: number;
}

function nextNum(c: Cursor): number {
  const v = parseFloat(c.tokens[c.i++]);
  if (Number.isNaN(v)) throw new Error("Malformed svgPath: expected a number");
  return v;
}

// Sample an SVG elliptical arc (endpoint parameterisation) into points, excluding the
// start point and including the end. Follows the SVG 1.1 implementation notes (F.6.5),
// then negates Y to convert to our Y-up space.
function sampleArc(
  p0: ExportPoint,
  rxIn: number,
  ryIn: number,
  xRotDeg: number,
  largeArc: boolean,
  sweep: boolean,
  end: ExportPoint
): ExportPoint[] {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) return [{ x: end.x, y: end.y }];

  const phi = (xRotDeg * Math.PI) / 180;
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);

  const dx = (p0.x - end.x) / 2;
  const dy = (p0.y - end.y) / 2;
  const x1p = cosP * dx + sinP * dy;
  const y1p = -sinP * dx + cosP * dy;

  // Scale radii up if they are too small to span the chord.
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }

  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let coef = den === 0 ? 0 : Math.sqrt(Math.max(0, num / den));
  if (largeArc === sweep) coef = -coef;

  const cxp = (coef * (rx * y1p)) / ry;
  const cyp = (coef * -(ry * x1p)) / rx;
  const cx = cosP * cxp - sinP * cyp + (p0.x + end.x) / 2;
  const cy = sinP * cxp + cosP * cyp + (p0.y + end.y) / 2;

  const ang = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    let a = Math.acos(Math.min(1, Math.max(-1, dot / len)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const theta1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dTheta = ang(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry
  );
  if (!sweep && dTheta > 0) dTheta -= TWO_PI;
  if (sweep && dTheta < 0) dTheta += TWO_PI;

  const steps = Math.max(2, Math.ceil(Math.abs(dTheta) / (Math.PI / 24)));
  const pts: ExportPoint[] = [];
  for (let k = 1; k <= steps; k++) {
    const t = theta1 + (dTheta * k) / steps;
    const x = cx + rx * Math.cos(t) * cosP - ry * Math.sin(t) * sinP;
    const y = cy + rx * Math.cos(t) * sinP + ry * Math.sin(t) * cosP;
    pts.push({ x, y: -y });
  }
  return pts;
}

function sampleCubic(
  p0: ExportPoint,
  c1: ExportPoint,
  c2: ExportPoint,
  p1: ExportPoint,
  steps = 24
): ExportPoint[] {
  const pts: ExportPoint[] = [];
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    const mt = 1 - t;
    const x =
      mt * mt * mt * p0.x +
      3 * mt * mt * t * c1.x +
      3 * mt * t * t * c2.x +
      t * t * t * p1.x;
    const y =
      mt * mt * mt * p0.y +
      3 * mt * mt * t * c1.y +
      3 * mt * t * t * c2.y +
      t * t * t * p1.y;
    pts.push({ x, y: -y });
  }
  return pts;
}

function sampleQuadratic(
  p0: ExportPoint,
  c: ExportPoint,
  p1: ExportPoint,
  steps = 24
): ExportPoint[] {
  const pts: ExportPoint[] = [];
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    const mt = 1 - t;
    const x = mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x;
    const y = mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y;
    pts.push({ x, y: -y });
  }
  return pts;
}

const flip = (p: ExportPoint): ExportPoint => ({ x: p.x, y: -p.y });

/**
 * Parse a stored `svgPath` into flattened, un-mirrored polyline entities (Y-up).
 * Returns one LWPOLYLINE per subpath. Coordinates are absolute (as emitted by
 * `lib/dxf/to-svg.ts`).
 */
export function parseSvgPathToEntities(svgPath: string): ExportEntity[] {
  const tokens = svgPath
    .replace(/([MLAQCZmlaqcz])/g, " $1 ")
    .replace(/,/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return [];

  const c: Cursor = { tokens, i: 0 };
  const entities: ExportEntity[] = [];

  // SVG-space (pre-flip) running point; flipped vertices accumulate per subpath.
  let cur: ExportPoint = { x: 0, y: 0 };
  let subStart: ExportPoint = { x: 0, y: 0 };
  let verts: ExportVertex[] = [];
  let closed = false;

  const flush = () => {
    if (verts.length >= 2) {
      entities.push({ type: "LWPOLYLINE", closed, vertices: verts });
    }
    verts = [];
    closed = false;
  };

  while (c.i < tokens.length) {
    const cmd = tokens[c.i++];
    switch (cmd) {
      case "M": {
        flush();
        cur = { x: nextNum(c), y: nextNum(c) };
        subStart = cur;
        verts = [flip(cur)];
        break;
      }
      case "L": {
        cur = { x: nextNum(c), y: nextNum(c) };
        verts.push(flip(cur));
        break;
      }
      case "A": {
        const rx = nextNum(c);
        const ry = nextNum(c);
        const rot = nextNum(c);
        const large = nextNum(c) !== 0;
        const sweep = nextNum(c) !== 0;
        const end = { x: nextNum(c), y: nextNum(c) };
        for (const p of sampleArc(cur, rx, ry, rot, large, sweep, end)) {
          verts.push(p);
        }
        cur = end;
        break;
      }
      case "C": {
        const c1 = { x: nextNum(c), y: nextNum(c) };
        const c2 = { x: nextNum(c), y: nextNum(c) };
        const end = { x: nextNum(c), y: nextNum(c) };
        for (const p of sampleCubic(cur, c1, c2, end)) verts.push(p);
        cur = end;
        break;
      }
      case "Q": {
        const cp = { x: nextNum(c), y: nextNum(c) };
        const end = { x: nextNum(c), y: nextNum(c) };
        for (const p of sampleQuadratic(cur, cp, end)) verts.push(p);
        cur = end;
        break;
      }
      case "Z":
      case "z": {
        closed = true;
        cur = subStart;
        break;
      }
      default:
        // Unknown / lowercase relative command — skip token defensively.
        break;
    }
  }
  flush();
  return entities;
}
