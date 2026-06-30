// Internal, geometry-source-agnostic entity model used by the DXF writer.
//
// All coordinates are in millimetres, in native DXF orientation (Y up). Angles on
// ARC are degrees (CCW, DXF convention); ELLIPSE start/end params are radians and the
// major-axis endpoint is stored *relative to the centre* (DXF group 11 convention).
//
// This model deliberately mirrors the entity data `dxf-parser` exposes so that the
// original uploaded DXF can be re-emitted losslessly (true arcs/circles/ellipses/
// splines), rather than round-tripping through the lossy, Y-flipped `svgPath`.

export interface ExportPoint {
  x: number;
  y: number;
}

export interface ExportVertex {
  x: number;
  y: number;
  /** Arc bulge to the next vertex (tan of a quarter of the included angle). */
  bulge?: number;
}

export type ExportEntity =
  | { type: "LINE"; layer?: string; start: ExportPoint; end: ExportPoint }
  | { type: "CIRCLE"; layer?: string; center: ExportPoint; radius: number }
  | {
      type: "ARC";
      layer?: string;
      center: ExportPoint;
      radius: number;
      /** Degrees, CCW. */
      startAngle: number;
      endAngle: number;
    }
  | {
      type: "ELLIPSE";
      layer?: string;
      center: ExportPoint;
      /** Major-axis endpoint relative to the centre. */
      majorAxisEnd: ExportPoint;
      /** Minor/major length ratio (0, 1]. */
      axisRatio: number;
      /** Start parameter, radians (0 for a full ellipse). */
      startParam: number;
      /** End parameter, radians (2π for a full ellipse). */
      endParam: number;
    }
  | {
      type: "LWPOLYLINE";
      layer?: string;
      closed: boolean;
      vertices: ExportVertex[];
    }
  | {
      type: "SPLINE";
      layer?: string;
      degree: number;
      closed: boolean;
      controlPoints: ExportPoint[];
      knots: number[];
      weights?: number[];
      fitPoints?: ExportPoint[];
    }
  | {
      type: "TEXT";
      layer?: string;
      position: ExportPoint;
      height: number;
      value: string;
    };

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Bounding box of a set of entities, using the *same metric* as the nesting
 * pipeline's `lib/dxf/parser.ts#computeBoundingBox`: line endpoints, centre±radius
 * for circles/arcs, centre±major for ellipses, polyline vertices, and spline control
 * points. Matching that metric exactly is what guarantees a placed part lands in the
 * cell the packer reserved for it, so parts stay non-overlapping after export.
 */
export function boundsForPlacement(entities: ExportEntity[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const expand = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  for (const e of entities) {
    switch (e.type) {
      case "LINE":
        expand(e.start.x, e.start.y);
        expand(e.end.x, e.end.y);
        break;
      case "CIRCLE":
      case "ARC":
        expand(e.center.x - e.radius, e.center.y - e.radius);
        expand(e.center.x + e.radius, e.center.y + e.radius);
        break;
      case "ELLIPSE": {
        const major = Math.hypot(e.majorAxisEnd.x, e.majorAxisEnd.y);
        expand(e.center.x - major, e.center.y - major);
        expand(e.center.x + major, e.center.y + major);
        break;
      }
      case "LWPOLYLINE":
        for (const v of e.vertices) expand(v.x, v.y);
        break;
      case "SPLINE":
        for (const p of e.controlPoints) expand(p.x, p.y);
        break;
      case "TEXT":
        expand(e.position.x, e.position.y);
        break;
    }
  }

  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { minX, minY, maxX, maxY };
}
