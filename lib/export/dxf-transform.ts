// Rigid-body transform (rotation + translation, never reflection) of export
// entities, used to drop each part's true geometry into its nested placement.
//
// A pure rotation keeps every entity exactly valid with trivial bookkeeping: an ARC's
// start/end angles shift by the rotation, an ELLIPSE's centre-relative major axis
// rotates, LWPOLYLINE bulges are rotation-invariant, and everything else is just point
// rotation. We never reflect (no Y-flip), because reflecting would mirror asymmetric
// parts — a part that no longer fits its mating features.

import {
  boundsForPlacement,
  type ExportEntity,
  type ExportPoint,
} from "./dxf-entities";

function normalizeDeg(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

interface PointTransform {
  /** Maps an absolute position. */
  point: (p: ExportPoint) => ExportPoint;
  /** Rotates a centre-relative direction vector (no translation). */
  vector: (p: ExportPoint) => ExportPoint;
  /** Degrees added to ARC start/end angles. */
  angleDeltaDeg: number;
}

function applyToEntity(e: ExportEntity, t: PointTransform): ExportEntity {
  switch (e.type) {
    case "LINE":
      return { ...e, start: t.point(e.start), end: t.point(e.end) };
    case "CIRCLE":
      return { ...e, center: t.point(e.center) };
    case "ARC":
      return {
        ...e,
        center: t.point(e.center),
        startAngle: normalizeDeg(e.startAngle + t.angleDeltaDeg),
        endAngle: normalizeDeg(e.endAngle + t.angleDeltaDeg),
      };
    case "ELLIPSE":
      return {
        ...e,
        center: t.point(e.center),
        majorAxisEnd: t.vector(e.majorAxisEnd),
      };
    case "LWPOLYLINE":
      return {
        ...e,
        // bulge is rotation-invariant; preserve it verbatim.
        vertices: e.vertices.map((v) => {
          const p = t.point(v);
          return { x: p.x, y: p.y, bulge: v.bulge };
        }),
      };
    case "SPLINE":
      return {
        ...e,
        controlPoints: e.controlPoints.map(t.point),
        fitPoints: e.fitPoints?.map(t.point),
      };
    case "TEXT":
      return { ...e, position: t.point(e.position) };
  }
}

/**
 * Rotate a part's entities by `rotationDeg` (CCW) about the part origin, then
 * translate so the rotated bounding box's min corner lands at (`targetX`,`targetY`).
 *
 * The bounding box is measured with `boundsForPlacement`, the same metric the nesting
 * packer used, so the part occupies exactly the cell it was nested into.
 */
export function placeEntities(
  entities: ExportEntity[],
  rotationDeg: number,
  targetX: number,
  targetY: number
): ExportEntity[] {
  const b = boundsForPlacement(entities);
  const theta = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  // Phase 1: shift to the part's local origin, then rotate about that origin.
  const rotateLocal: PointTransform = {
    point: (p) => {
      const lx = p.x - b.minX;
      const ly = p.y - b.minY;
      return { x: cos * lx - sin * ly, y: sin * lx + cos * ly };
    },
    vector: (p) => ({ x: cos * p.x - sin * p.y, y: sin * p.x + cos * p.y }),
    angleDeltaDeg: rotationDeg,
  };
  const rotated = entities.map((e) => applyToEntity(e, rotateLocal));

  // Phase 2: translate the rotated geometry so its min corner sits at the target.
  const rb = boundsForPlacement(rotated);
  const dx = targetX - rb.minX;
  const dy = targetY - rb.minY;
  const translate: PointTransform = {
    point: (p) => ({ x: p.x + dx, y: p.y + dy }),
    vector: (p) => p,
    angleDeltaDeg: 0,
  };
  return rotated.map((e) => applyToEntity(e, translate));
}
