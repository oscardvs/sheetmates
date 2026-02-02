import type { DxfEntity, ParsedDxf } from "./parser";

export function dxfToSvgPath(parsed: ParsedDxf): string {
  const paths: string[] = [];

  // Offset to normalize coordinates to (0,0) origin
  const offsetX = parsed.boundingBox.minX;
  const offsetY = parsed.boundingBox.minY;
  // For Y-flip, use height instead of maxY
  const height = parsed.boundingBox.maxY - parsed.boundingBox.minY;

  for (const entity of parsed.entities) {
    const path = entityToSvgPath(entity, offsetX, offsetY, height);
    if (path) paths.push(path);
  }

  return paths.join(" ");
}

// Transform coordinate: subtract offset and flip Y
function transformX(x: number, offsetX: number): number {
  return x - offsetX;
}

function transformY(y: number, offsetY: number, height: number): number {
  return height - (y - offsetY);
}

function entityToSvgPath(
  entity: DxfEntity,
  offsetX: number,
  offsetY: number,
  height: number
): string | null {
  switch (entity.type) {
    case "LINE": {
      if (!entity.startPoint || !entity.endPoint) return null;
      const sx = transformX(entity.startPoint.x, offsetX);
      const sy = transformY(entity.startPoint.y, offsetY, height);
      const ex = transformX(entity.endPoint.x, offsetX);
      const ey = transformY(entity.endPoint.y, offsetY, height);
      return `M ${sx} ${sy} L ${ex} ${ey}`;
    }

    case "CIRCLE": {
      if (!entity.center || entity.radius == null) return null;
      const cx = transformX(entity.center.x, offsetX);
      const cy = transformY(entity.center.y, offsetY, height);
      const r = entity.radius;
      return (
        `M ${cx - r} ${cy} ` +
        `A ${r} ${r} 0 1 0 ${cx + r} ${cy} ` +
        `A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`
      );
    }

    case "ARC": {
      if (
        !entity.center ||
        entity.radius == null ||
        entity.startAngle == null ||
        entity.endAngle == null
      )
        return null;
      const cx = entity.center.x;
      const cy = entity.center.y;
      const r = entity.radius;
      const sa = (entity.startAngle * Math.PI) / 180;
      const ea = (entity.endAngle * Math.PI) / 180;
      const sx = transformX(cx + r * Math.cos(sa), offsetX);
      const sy = transformY(cy + r * Math.sin(sa), offsetY, height);
      const ex = transformX(cx + r * Math.cos(ea), offsetX);
      const ey = transformY(cy + r * Math.sin(ea), offsetY, height);
      let angle = entity.endAngle - entity.startAngle;
      if (angle < 0) angle += 360;
      const largeArc = angle > 180 ? 1 : 0;
      return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 0 ${ex} ${ey}`;
    }

    case "ELLIPSE": {
      if (!entity.center || !entity.majorAxisEndPoint) return null;
      const cx = transformX(entity.center.x, offsetX);
      const cy = transformY(entity.center.y, offsetY, height);
      const mx = entity.majorAxisEndPoint.x;
      const my = entity.majorAxisEndPoint.y;
      const major = Math.sqrt(mx * mx + my * my);
      const minor = major * (entity.axisRatio || 1);
      const angle = (Math.atan2(my, mx) * 180) / Math.PI;
      return (
        `M ${cx - major} ${cy} ` +
        `A ${major} ${minor} ${angle} 1 0 ${cx + major} ${cy} ` +
        `A ${major} ${minor} ${angle} 1 0 ${cx - major} ${cy} Z`
      );
    }

    case "LWPOLYLINE":
    case "POLYLINE": {
      if (!entity.vertices || entity.vertices.length === 0) return null;
      const parts: string[] = [];
      for (let i = 0; i < entity.vertices.length; i++) {
        const v = entity.vertices[i];
        const x = transformX(v.x, offsetX);
        const y = transformY(v.y, offsetY, height);
        if (i === 0) {
          parts.push(`M ${x} ${y}`);
        } else {
          const prev = entity.vertices[i - 1];
          if (prev.bulge && prev.bulge !== 0) {
            const bulge = prev.bulge;
            const prevX = transformX(prev.x, offsetX);
            const prevY = transformY(prev.y, offsetY, height);
            const dx = x - prevX;
            const dy = y - prevY;
            const chord = Math.sqrt(dx * dx + dy * dy);
            const sagitta = Math.abs(bulge) * (chord / 2);
            const r =
              (chord * chord) / (8 * sagitta) + sagitta / 2;
            const sweepFlag = bulge > 0 ? 0 : 1;
            const largeArcFlag = Math.abs(bulge) > 1 ? 1 : 0;
            parts.push(
              `A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${x} ${y}`
            );
          } else {
            parts.push(`L ${x} ${y}`);
          }
        }
      }
      if (entity.shape || entity.type === "LWPOLYLINE") {
        const first = entity.vertices[0];
        const last = entity.vertices[entity.vertices.length - 1];
        if (first.x === last.x && first.y === last.y) {
          parts.push("Z");
        }
      }
      return parts.join(" ");
    }

    case "SPLINE": {
      if (!entity.controlPoints || entity.controlPoints.length < 2)
        return null;
      const pts = entity.controlPoints;
      const parts: string[] = [
        `M ${transformX(pts[0].x, offsetX)} ${transformY(pts[0].y, offsetY, height)}`,
      ];
      if (pts.length === 2) {
        parts.push(
          `L ${transformX(pts[1].x, offsetX)} ${transformY(pts[1].y, offsetY, height)}`
        );
      } else if (pts.length === 3) {
        parts.push(
          `Q ${transformX(pts[1].x, offsetX)} ${transformY(pts[1].y, offsetY, height)} ${transformX(pts[2].x, offsetX)} ${transformY(pts[2].y, offsetY, height)}`
        );
      } else {
        for (let i = 1; i < pts.length - 2; i += 3) {
          const p1 = pts[i];
          const p2 = pts[Math.min(i + 1, pts.length - 1)];
          const p3 = pts[Math.min(i + 2, pts.length - 1)];
          parts.push(
            `C ${transformX(p1.x, offsetX)} ${transformY(p1.y, offsetY, height)} ${transformX(p2.x, offsetX)} ${transformY(p2.y, offsetY, height)} ${transformX(p3.x, offsetX)} ${transformY(p3.y, offsetY, height)}`
          );
        }
      }
      return parts.join(" ");
    }

    default:
      return null;
  }
}
