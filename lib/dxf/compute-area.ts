import type { ParsedDxf } from "./parser";

export function computeArea(parsed: ParsedDxf): number {
  // Try Shoelace formula on closed polylines first
  for (const entity of parsed.entities) {
    if (
      (entity.type === "LWPOLYLINE" || entity.type === "POLYLINE") &&
      entity.vertices &&
      entity.vertices.length >= 3
    ) {
      const verts = entity.vertices;
      const first = verts[0];
      const last = verts[verts.length - 1];
      const closed = first.x === last.x && first.y === last.y;

      if (closed) {
        const area = shoelaceArea(verts);
        if (area > 0) return area;
      }
    }

    if (entity.type === "CIRCLE" && entity.radius != null) {
      return Math.PI * entity.radius * entity.radius;
    }
  }

  // Fallback to bounding box area
  return parsed.width * parsed.height;
}

function shoelaceArea(
  vertices: { x: number; y: number }[]
): number {
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
}
