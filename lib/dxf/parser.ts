import DxfParser from "dxf-parser";

export interface ParsedDxf {
  entities: DxfEntity[];
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
  width: number;
  height: number;
}

export interface DxfEntity {
  type: string;
  vertices?: { x: number; y: number; bulge?: number }[];
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
  center?: { x: number; y: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  majorAxisEndPoint?: { x: number; y: number };
  axisRatio?: number;
  controlPoints?: { x: number; y: number }[];
  shape?: boolean;
}

export function parseDxfString(content: string): ParsedDxf {
  const parser = new DxfParser();
  const dxf = parser.parseSync(content);
  if (!dxf || !dxf.entities || dxf.entities.length === 0) {
    throw new Error("No entities found in DXF file");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entities: DxfEntity[] = dxf.entities.map((e: any) => ({
    type: e.type as string,
    vertices: e.vertices as DxfEntity["vertices"],
    startPoint: e.startPoint as DxfEntity["startPoint"],
    endPoint: e.endPoint as DxfEntity["endPoint"],
    center: e.center as DxfEntity["center"],
    radius: e.radius as number | undefined,
    startAngle: e.startAngle as number | undefined,
    endAngle: e.endAngle as number | undefined,
    majorAxisEndPoint: e.majorAxisEndPoint as DxfEntity["majorAxisEndPoint"],
    axisRatio: e.axisRatio as number | undefined,
    controlPoints: e.controlPoints as DxfEntity["controlPoints"],
    shape: e.shape as boolean | undefined,
  }));

  const bbox = computeBoundingBox(entities);

  return {
    entities,
    boundingBox: bbox,
    width: bbox.maxX - bbox.minX,
    height: bbox.maxY - bbox.minY,
  };
}

function computeBoundingBox(entities: DxfEntity[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  function expand(x: number, y: number) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  for (const e of entities) {
    switch (e.type) {
      case "LINE":
        if (e.startPoint) expand(e.startPoint.x, e.startPoint.y);
        if (e.endPoint) expand(e.endPoint.x, e.endPoint.y);
        break;
      case "CIRCLE":
        if (e.center && e.radius != null) {
          expand(e.center.x - e.radius, e.center.y - e.radius);
          expand(e.center.x + e.radius, e.center.y + e.radius);
        }
        break;
      case "ARC":
        if (e.center && e.radius != null) {
          expand(e.center.x - e.radius, e.center.y - e.radius);
          expand(e.center.x + e.radius, e.center.y + e.radius);
        }
        break;
      case "ELLIPSE":
        if (e.center && e.majorAxisEndPoint) {
          const mx = Math.abs(e.majorAxisEndPoint.x);
          const my = Math.abs(e.majorAxisEndPoint.y);
          const major = Math.sqrt(mx * mx + my * my);
          expand(e.center.x - major, e.center.y - major);
          expand(e.center.x + major, e.center.y + major);
        }
        break;
      case "LWPOLYLINE":
      case "POLYLINE":
        if (e.vertices) {
          for (const v of e.vertices) {
            expand(v.x, v.y);
          }
        }
        break;
      case "SPLINE":
        if (e.controlPoints) {
          for (const p of e.controlPoints) {
            expand(p.x, p.y);
          }
        }
        break;
    }
  }

  if (!isFinite(minX)) {
    minX = minY = 0;
    maxX = maxY = 100;
  }

  return { minX, minY, maxX, maxY };
}
