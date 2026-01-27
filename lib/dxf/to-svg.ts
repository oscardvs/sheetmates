import type { DxfEntity, ParsedDxf } from "./parser";

export function dxfToSvgPath(parsed: ParsedDxf): string {
  const paths: string[] = [];

  for (const entity of parsed.entities) {
    const path = entityToSvgPath(entity, parsed.boundingBox.maxY);
    if (path) paths.push(path);
  }

  return paths.join(" ");
}

function flipY(y: number, maxY: number): number {
  return maxY - y;
}

function entityToSvgPath(
  entity: DxfEntity,
  maxY: number
): string | null {
  switch (entity.type) {
    case "LINE": {
      if (!entity.startPoint || !entity.endPoint) return null;
      const sx = entity.startPoint.x;
      const sy = flipY(entity.startPoint.y, maxY);
      const ex = entity.endPoint.x;
      const ey = flipY(entity.endPoint.y, maxY);
      return `M ${sx} ${sy} L ${ex} ${ey}`;
    }

    case "CIRCLE": {
      if (!entity.center || entity.radius == null) return null;
      const cx = entity.center.x;
      const cy = flipY(entity.center.y, maxY);
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
      const sx = cx + r * Math.cos(sa);
      const sy = flipY(cy + r * Math.sin(sa), maxY);
      const ex = cx + r * Math.cos(ea);
      const ey = flipY(cy + r * Math.sin(ea), maxY);
      let angle = entity.endAngle - entity.startAngle;
      if (angle < 0) angle += 360;
      const largeArc = angle > 180 ? 1 : 0;
      return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 0 ${ex} ${ey}`;
    }

    case "ELLIPSE": {
      if (!entity.center || !entity.majorAxisEndPoint) return null;
      const cx = entity.center.x;
      const cy = flipY(entity.center.y, maxY);
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
        const x = v.x;
        const y = flipY(v.y, maxY);
        if (i === 0) {
          parts.push(`M ${x} ${y}`);
        } else {
          const prev = entity.vertices[i - 1];
          if (prev.bulge && prev.bulge !== 0) {
            const bulge = prev.bulge;
            const dx = x - prev.x;
            const dy = flipY(v.y, maxY) - flipY(prev.y, maxY);
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
        `M ${pts[0].x} ${flipY(pts[0].y, maxY)}`,
      ];
      if (pts.length === 2) {
        parts.push(
          `L ${pts[1].x} ${flipY(pts[1].y, maxY)}`
        );
      } else if (pts.length === 3) {
        parts.push(
          `Q ${pts[1].x} ${flipY(pts[1].y, maxY)} ${pts[2].x} ${flipY(pts[2].y, maxY)}`
        );
      } else {
        for (let i = 1; i < pts.length - 2; i += 3) {
          const p1 = pts[i];
          const p2 = pts[Math.min(i + 1, pts.length - 1)];
          const p3 = pts[Math.min(i + 2, pts.length - 1)];
          parts.push(
            `C ${p1.x} ${flipY(p1.y, maxY)} ${p2.x} ${flipY(p2.y, maxY)} ${p3.x} ${flipY(p3.y, maxY)}`
          );
        }
      }
      return parts.join(" ");
    }

    default:
      return null;
  }
}
