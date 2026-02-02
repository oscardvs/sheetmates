import DxfParser from "dxf-parser";

export type DxfUnit = "mm" | "inches" | "feet" | "cm" | "unknown";

export interface ParsedDxf {
  entities: DxfEntity[];
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
  width: number;
  height: number;
  detectedUnit: DxfUnit;
  wasConverted: boolean;
}

// AutoCAD $INSUNITS codes
const UNIT_CODES: Record<number, DxfUnit> = {
  0: "unknown", // Unitless
  1: "inches",
  2: "feet",
  4: "mm",
  5: "cm",
};

// Conversion factors to mm
const TO_MM: Record<DxfUnit, number> = {
  mm: 1,
  inches: 25.4,
  feet: 304.8,
  cm: 10,
  unknown: 1, // No conversion for unknown
};

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

  // Detect units from $INSUNITS header
  let detectedUnit: DxfUnit = "unknown";
  if (dxf.header && typeof dxf.header.$INSUNITS === "number") {
    detectedUnit = UNIT_CODES[dxf.header.$INSUNITS] || "unknown";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let entities: DxfEntity[] = dxf.entities.map((e: any) => ({
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

  // Compute initial bounding box to check dimensions
  let bbox = computeBoundingBox(entities);
  let width = bbox.maxX - bbox.minX;
  let height = bbox.maxY - bbox.minY;

  // Heuristic: if units are unknown and dimensions are small, assume inches
  if (detectedUnit === "unknown" && width < 50 && height < 50) {
    detectedUnit = "inches";
  }

  // Apply unit conversion if not already in mm
  let wasConverted = false;
  if (detectedUnit !== "mm" && detectedUnit !== "unknown") {
    const factor = TO_MM[detectedUnit];
    entities = convertEntitiesToMm(entities, factor);
    bbox = computeBoundingBox(entities);
    width = bbox.maxX - bbox.minX;
    height = bbox.maxY - bbox.minY;
    wasConverted = true;
  }

  return {
    entities,
    boundingBox: bbox,
    width,
    height,
    detectedUnit,
    wasConverted,
  };
}

function convertEntitiesToMm(entities: DxfEntity[], factor: number): DxfEntity[] {
  return entities.map((e) => ({
    ...e,
    vertices: e.vertices?.map((v) => ({
      ...v,
      x: v.x * factor,
      y: v.y * factor,
    })),
    startPoint: e.startPoint
      ? { x: e.startPoint.x * factor, y: e.startPoint.y * factor }
      : undefined,
    endPoint: e.endPoint
      ? { x: e.endPoint.x * factor, y: e.endPoint.y * factor }
      : undefined,
    center: e.center
      ? { x: e.center.x * factor, y: e.center.y * factor }
      : undefined,
    radius: e.radius != null ? e.radius * factor : undefined,
    majorAxisEndPoint: e.majorAxisEndPoint
      ? { x: e.majorAxisEndPoint.x * factor, y: e.majorAxisEndPoint.y * factor }
      : undefined,
    controlPoints: e.controlPoints?.map((p) => ({
      x: p.x * factor,
      y: p.y * factor,
    })),
  }));
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
