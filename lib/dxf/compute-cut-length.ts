import type { ParsedDxf } from "./parser";

export function computeCutLength(parsed: ParsedDxf): number {
  let total = 0;

  for (const entity of parsed.entities) {
    switch (entity.type) {
      case "LINE": {
        if (entity.startPoint && entity.endPoint) {
          const dx = entity.endPoint.x - entity.startPoint.x;
          const dy = entity.endPoint.y - entity.startPoint.y;
          total += Math.sqrt(dx * dx + dy * dy);
        }
        break;
      }

      case "CIRCLE": {
        if (entity.radius != null) {
          total += 2 * Math.PI * entity.radius;
        }
        break;
      }

      case "ARC": {
        if (
          entity.radius != null &&
          entity.startAngle != null &&
          entity.endAngle != null
        ) {
          let angle = entity.endAngle - entity.startAngle;
          if (angle < 0) angle += 360;
          total += (angle / 360) * 2 * Math.PI * entity.radius;
        }
        break;
      }

      case "LWPOLYLINE":
      case "POLYLINE": {
        if (entity.vertices && entity.vertices.length >= 2) {
          for (let i = 1; i < entity.vertices.length; i++) {
            const prev = entity.vertices[i - 1];
            const curr = entity.vertices[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            total += Math.sqrt(dx * dx + dy * dy);
          }
        }
        break;
      }

      case "ELLIPSE": {
        if (entity.majorAxisEndPoint) {
          const mx = entity.majorAxisEndPoint.x;
          const my = entity.majorAxisEndPoint.y;
          const a = Math.sqrt(mx * mx + my * my);
          const b = a * (entity.axisRatio || 1);
          // Ramanujan approximation
          total +=
            Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
        }
        break;
      }

      case "SPLINE": {
        if (entity.controlPoints && entity.controlPoints.length >= 2) {
          for (let i = 1; i < entity.controlPoints.length; i++) {
            const prev = entity.controlPoints[i - 1];
            const curr = entity.controlPoints[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            total += Math.sqrt(dx * dx + dy * dy);
          }
        }
        break;
      }
    }
  }

  return total;
}
