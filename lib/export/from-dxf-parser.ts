// Highest-fidelity geometry source: parse the ORIGINAL uploaded DXF fresh with
// `dxf-parser` and convert to our `ExportEntity` model, preserving true arcs, circles,
// ellipses, and splines (control points + knots + degree).
//
// We parse the original file directly rather than reusing the app's `ParsedDxf`
// wrapper (`lib/dxf/parser.ts`), which strips knot vectors, spline degree, and ellipse
// params. We DO replicate that wrapper's unit handling so coordinates come out in
// millimetres, matching the part's stored mm geometry and the nested placements.

import DxfParser from "dxf-parser";
import type { ExportEntity, ExportPoint } from "./dxf-entities";
import { boundsForPlacement } from "./dxf-entities";

type DxfUnit = "mm" | "inches" | "feet" | "cm" | "unknown";

// $INSUNITS codes and conversion factors — kept in sync with lib/dxf/parser.ts.
const UNIT_CODES: Record<number, DxfUnit> = {
  0: "unknown",
  1: "inches",
  2: "feet",
  4: "mm",
  5: "cm",
};
const TO_MM: Record<DxfUnit, number> = {
  mm: 1,
  inches: 25.4,
  feet: 304.8,
  cm: 10,
  unknown: 1,
};

const RAD_TO_DEG = 180 / Math.PI;

interface RawPoint {
  x: number;
  y: number;
}
interface RawVertex extends RawPoint {
  bulge?: number;
}
// Loose view over dxf-parser's entity union — fields are read defensively.
interface RawEntity {
  type: string;
  vertices?: RawVertex[];
  center?: RawPoint;
  radius?: number;
  startAngle?: number; // radians (dxf-parser converts ARC/CIRCLE angles)
  endAngle?: number;
  majorAxisEndPoint?: RawPoint;
  axisRatio?: number;
  controlPoints?: RawPoint[];
  fitPoints?: RawPoint[];
  knotValues?: number[];
  weights?: number[];
  degreeOfSplineCurve?: number;
  closed?: boolean;
  shape?: boolean; // polyline closed flag
}

function toExportEntity(e: RawEntity): ExportEntity | null {
  switch (e.type) {
    case "LINE": {
      if (!e.vertices || e.vertices.length < 2) return null;
      return { type: "LINE", start: e.vertices[0], end: e.vertices[1] };
    }
    case "CIRCLE": {
      if (!e.center || e.radius == null) return null;
      return { type: "CIRCLE", center: e.center, radius: e.radius };
    }
    case "ARC": {
      if (e.center == null || e.radius == null) return null;
      const start = e.startAngle ?? 0;
      const end = e.endAngle ?? 2 * Math.PI;
      return {
        type: "ARC",
        center: e.center,
        radius: e.radius,
        startAngle: start * RAD_TO_DEG,
        endAngle: end * RAD_TO_DEG,
      };
    }
    case "ELLIPSE": {
      if (!e.center || !e.majorAxisEndPoint) return null;
      return {
        type: "ELLIPSE",
        center: e.center,
        majorAxisEnd: e.majorAxisEndPoint,
        axisRatio: e.axisRatio ?? 1,
        // dxf-parser stores ellipse start/end params (group 41/42) in radians.
        startParam: e.startAngle ?? 0,
        endParam: e.endAngle ?? 2 * Math.PI,
      };
    }
    case "LWPOLYLINE":
    case "POLYLINE": {
      if (!e.vertices || e.vertices.length < 2) return null;
      return {
        type: "LWPOLYLINE",
        closed: e.shape === true,
        vertices: e.vertices.map((v) => ({
          x: v.x,
          y: v.y,
          ...(v.bulge ? { bulge: v.bulge } : {}),
        })),
      };
    }
    case "SPLINE": {
      if (!e.controlPoints || e.controlPoints.length < 2) return null;
      const degree = e.degreeOfSplineCurve ?? 3;
      return {
        type: "SPLINE",
        degree,
        closed: e.closed === true,
        controlPoints: e.controlPoints.map((p) => ({ x: p.x, y: p.y })),
        knots: e.knotValues ? [...e.knotValues] : [],
        ...(e.weights && e.weights.length ? { weights: [...e.weights] } : {}),
        ...(e.fitPoints && e.fitPoints.length
          ? { fitPoints: e.fitPoints.map((p) => ({ x: p.x, y: p.y })) }
          : {}),
      };
    }
    default:
      // POINT, TEXT, INSERT, etc. are not part of the cut geometry; ignore them.
      return null;
  }
}

function scalePoint(p: ExportPoint, f: number): ExportPoint {
  return { x: p.x * f, y: p.y * f };
}

// Scales lengths to mm. Angles (ARC degrees, ELLIPSE params) and spline knots
// (parametric) and bulges are scale-invariant and pass through untouched.
function scaleEntity(e: ExportEntity, f: number): ExportEntity {
  if (f === 1) return e;
  switch (e.type) {
    case "LINE":
      return { ...e, start: scalePoint(e.start, f), end: scalePoint(e.end, f) };
    case "CIRCLE":
      return { ...e, center: scalePoint(e.center, f), radius: e.radius * f };
    case "ARC":
      return { ...e, center: scalePoint(e.center, f), radius: e.radius * f };
    case "ELLIPSE":
      return {
        ...e,
        center: scalePoint(e.center, f),
        majorAxisEnd: scalePoint(e.majorAxisEnd, f),
      };
    case "LWPOLYLINE":
      return {
        ...e,
        vertices: e.vertices.map((v) => ({
          x: v.x * f,
          y: v.y * f,
          bulge: v.bulge,
        })),
      };
    case "SPLINE":
      return {
        ...e,
        controlPoints: e.controlPoints.map((p) => scalePoint(p, f)),
        fitPoints: e.fitPoints?.map((p) => scalePoint(p, f)),
      };
    case "TEXT":
      return { ...e, position: scalePoint(e.position, f), height: e.height * f };
  }
}

/**
 * Parse an original DXF file's text into `ExportEntity[]` in millimetres.
 * Throws if the file cannot be parsed or contains no convertible geometry.
 */
export function parseOriginalDxfToEntities(content: string): ExportEntity[] {
  const parser = new DxfParser();
  const dxf = parser.parseSync(content);
  if (!dxf || !dxf.entities || dxf.entities.length === 0) {
    throw new Error("No entities found in DXF file");
  }

  const raw = dxf.entities as unknown as RawEntity[];
  const entities = raw
    .map(toExportEntity)
    .filter((e): e is ExportEntity => e !== null);
  if (entities.length === 0) {
    throw new Error("DXF contains no cut geometry (lines/arcs/circles/...)");
  }

  // Resolve unit scale to mm — mirrors lib/dxf/parser.ts (incl. the "unknown +
  // small => inches" heuristic) so this matches how the part was first interpreted.
  let unit: DxfUnit = "unknown";
  const insunits = dxf.header?.$INSUNITS;
  if (typeof insunits === "number") unit = UNIT_CODES[insunits] ?? "unknown";

  if (unit === "unknown") {
    const b = boundsForPlacement(entities);
    if (b.maxX - b.minX < 50 && b.maxY - b.minY < 50) unit = "inches";
  }
  const factor = unit === "mm" || unit === "unknown" ? 1 : TO_MM[unit];

  return factor === 1 ? entities : entities.map((e) => scaleEntity(e, factor));
}
