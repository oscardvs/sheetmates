// Production DXF writer — emits a valid AutoCAD R2000 (AC1015) file.
//
// Why AC1015 (see docs/plans/2026-06-30-dxf-export-research.md): it is the lowest DXF
// version that carries native LWPOLYLINE, ELLIPSE, and true (NURBS) SPLINE entities,
// and every modern fiber-laser CAM reads it. ARC/CIRCLE are emitted natively (never
// faceted). Units are millimetres ($INSUNITS = 4); no kerf compensation is applied —
// the laser controller offsets half-kerf from its own tech tables, so contours stay
// nominal (pre-offsetting would double-compensate).
//
// The file carries proper handles, symbol tables, model/paper-space block records, and
// an OBJECTS dictionary so it audits cleanly (ezdxf) and round-trips through dxf-parser.

import { boundsForPlacement, type ExportEntity } from "./dxf-entities";
import { placeEntities } from "./dxf-transform";

export const LAYER_CUT = "CUT";
export const LAYER_SHEET = "SHEET";
export const LAYER_LABEL = "LABEL";

/** A part to place on the sheet: its geometry plus where the packer nested it. */
export interface PlacedPart {
  partId: string;
  /** Native (Y-up, mm) geometry of the part in its own coordinate space. */
  entities: ExportEntity[];
  placement: { x: number; y: number; rotation: number };
  /** Optional operator label drawn on the LABEL layer. */
  label?: string;
}

export interface NestingSheetInfo {
  id?: string;
  width: number;
  height: number;
  material?: string;
  thickness?: number;
}

export interface GenerateDxfOptions {
  /** Draw the sheet boundary rectangle on the SHEET layer. Default true. */
  includeSheetOutline?: boolean;
  /** Draw a TEXT label per part on the LABEL layer. Default true. */
  includeLabels?: boolean;
}

// ---------------------------------------------------------------------------
// Low-level group-code writer + handle allocation
// ---------------------------------------------------------------------------

class DxfBuilder {
  private out: string[] = [];
  private handle = 0x100;

  nextHandle(): string {
    return (this.handle++).toString(16).toUpperCase();
  }

  /** Current seed value (= next handle that will be issued). */
  seed(): string {
    return this.handle.toString(16).toUpperCase();
  }

  g(code: number, value: string | number): void {
    this.out.push(String(code), String(value));
  }

  toString(): string {
    return this.out.join("\n") + "\n";
  }
}

// Coordinates are written with enough precision for sub-micron fidelity without
// dumping float noise.
function fmt(n: number): string {
  if (!isFinite(n)) return "0";
  // Trim to 6 decimals, strip trailing zeros.
  const s = n.toFixed(6);
  return s.replace(/\.?0+$/, "") || "0";
}

// ---------------------------------------------------------------------------
// Entity serialisation
// ---------------------------------------------------------------------------

function writeEntityHeader(
  b: DxfBuilder,
  dxfType: string,
  subclass: string,
  layer: string,
  ownerHandle: string
): void {
  b.g(0, dxfType);
  b.g(5, b.nextHandle());
  b.g(330, ownerHandle);
  b.g(100, "AcDbEntity");
  b.g(8, layer);
  b.g(100, subclass);
}

function writeEntity(b: DxfBuilder, e: ExportEntity, owner: string): void {
  const layer = e.layer ?? LAYER_CUT;
  switch (e.type) {
    case "LINE": {
      writeEntityHeader(b, "LINE", "AcDbLine", layer, owner);
      b.g(10, fmt(e.start.x));
      b.g(20, fmt(e.start.y));
      b.g(30, 0);
      b.g(11, fmt(e.end.x));
      b.g(21, fmt(e.end.y));
      b.g(31, 0);
      break;
    }
    case "CIRCLE": {
      writeEntityHeader(b, "CIRCLE", "AcDbCircle", layer, owner);
      b.g(10, fmt(e.center.x));
      b.g(20, fmt(e.center.y));
      b.g(30, 0);
      b.g(40, fmt(e.radius));
      break;
    }
    case "ARC": {
      writeEntityHeader(b, "ARC", "AcDbCircle", layer, owner);
      b.g(10, fmt(e.center.x));
      b.g(20, fmt(e.center.y));
      b.g(30, 0);
      b.g(40, fmt(e.radius));
      b.g(100, "AcDbArc");
      b.g(50, fmt(e.startAngle));
      b.g(51, fmt(e.endAngle));
      break;
    }
    case "ELLIPSE": {
      writeEntityHeader(b, "ELLIPSE", "AcDbEllipse", layer, owner);
      b.g(10, fmt(e.center.x));
      b.g(20, fmt(e.center.y));
      b.g(30, 0);
      b.g(11, fmt(e.majorAxisEnd.x));
      b.g(21, fmt(e.majorAxisEnd.y));
      b.g(31, 0);
      b.g(210, 0);
      b.g(220, 0);
      b.g(230, 1);
      b.g(40, fmt(e.axisRatio));
      b.g(41, fmt(e.startParam));
      b.g(42, fmt(e.endParam));
      break;
    }
    case "LWPOLYLINE": {
      writeEntityHeader(b, "LWPOLYLINE", "AcDbPolyline", layer, owner);
      b.g(90, e.vertices.length);
      b.g(70, e.closed ? 1 : 0);
      for (const v of e.vertices) {
        b.g(10, fmt(v.x));
        b.g(20, fmt(v.y));
        if (v.bulge) b.g(42, fmt(v.bulge));
      }
      break;
    }
    case "SPLINE": {
      writeEntityHeader(b, "SPLINE", "AcDbSpline", layer, owner);
      b.g(210, 0);
      b.g(220, 0);
      b.g(230, 1);
      const rational = !!(e.weights && e.weights.length === e.controlPoints.length);
      // bit0 closed, bit2 rational, bit3 planar
      let flags = 8;
      if (e.closed) flags |= 1;
      if (rational) flags |= 4;
      b.g(70, flags);
      b.g(71, e.degree);
      b.g(72, e.knots.length);
      b.g(73, e.controlPoints.length);
      b.g(74, e.fitPoints?.length ?? 0);
      for (const k of e.knots) b.g(40, fmt(k));
      if (rational) for (const w of e.weights!) b.g(41, fmt(w));
      for (const p of e.controlPoints) {
        b.g(10, fmt(p.x));
        b.g(20, fmt(p.y));
        b.g(30, 0);
      }
      if (e.fitPoints) {
        for (const p of e.fitPoints) {
          b.g(11, fmt(p.x));
          b.g(21, fmt(p.y));
          b.g(31, 0);
        }
      }
      break;
    }
    case "TEXT": {
      writeEntityHeader(b, "TEXT", "AcDbText", layer, owner);
      b.g(10, fmt(e.position.x));
      b.g(20, fmt(e.position.y));
      b.g(30, 0);
      b.g(40, fmt(e.height));
      b.g(1, e.value);
      b.g(7, "STANDARD");
      b.g(100, "AcDbText");
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Symbol tables / blocks / objects boilerplate
// ---------------------------------------------------------------------------

function tableEntry(
  b: DxfBuilder,
  dxfType: string,
  subclass: string,
  ownerHandle: string,
  name: string,
  body: (h: string) => void
): void {
  const h = b.nextHandle();
  b.g(0, dxfType);
  b.g(5, h);
  b.g(330, ownerHandle);
  b.g(100, "AcDbSymbolTableRecord");
  b.g(100, subclass);
  b.g(2, name);
  body(h);
}

interface Handles {
  blockRecordTable: string;
  modelSpace: string;
  paperSpace: string;
}

function writeTables(b: DxfBuilder, layers: string[]): Handles {
  b.g(0, "SECTION");
  b.g(2, "TABLES");

  const beginTable = (name: string, count: number): string => {
    const h = b.nextHandle();
    b.g(0, "TABLE");
    b.g(2, name);
    b.g(5, h);
    b.g(330, "0");
    b.g(100, "AcDbSymbolTable");
    b.g(70, count);
    return h;
  };
  const endTable = () => b.g(0, "ENDTAB");

  // VPORT
  const vportTable = beginTable("VPORT", 1);
  tableEntry(b, "VPORT", "AcDbViewportTableRecord", vportTable, "*Active", () => {
    b.g(70, 0);
    b.g(10, 0); b.g(20, 0);
    b.g(11, 1); b.g(21, 1);
    b.g(12, 1500); b.g(22, 750);
    b.g(13, 0); b.g(23, 0);
    b.g(14, 10); b.g(24, 10);
    b.g(15, 10); b.g(25, 10);
    b.g(16, 0); b.g(26, 0); b.g(36, 1);
    b.g(17, 0); b.g(27, 0); b.g(37, 0);
    b.g(40, 1500); b.g(41, 2); b.g(42, 50); b.g(43, 0); b.g(44, 0);
    b.g(50, 0); b.g(51, 0); b.g(71, 0); b.g(72, 1000);
    b.g(73, 1); b.g(74, 3); b.g(75, 0); b.g(76, 0); b.g(77, 0); b.g(78, 0);
  });
  endTable();

  // LTYPE
  const ltypeTable = beginTable("LTYPE", 3);
  for (const lt of ["ByBlock", "ByLayer", "Continuous"]) {
    tableEntry(b, "LTYPE", "AcDbLinetypeTableRecord", ltypeTable, lt, () => {
      b.g(70, 0);
      b.g(3, lt === "Continuous" ? "Solid line" : "");
      b.g(72, 65);
      b.g(73, 0);
      b.g(40, 0);
    });
  }
  endTable();

  // LAYER (0 + our layers)
  const allLayers = ["0", ...layers];
  const layerTable = beginTable("LAYER", allLayers.length);
  for (const name of allLayers) {
    tableEntry(b, "LAYER", "AcDbLayerTableRecord", layerTable, name, () => {
      b.g(70, 0);
      b.g(62, 7); // color: white/black
      b.g(6, "Continuous");
      b.g(370, 0); // lineweight: default
    });
  }
  endTable();

  // STYLE
  const styleTable = beginTable("STYLE", 1);
  tableEntry(b, "STYLE", "AcDbTextStyleTableRecord", styleTable, "Standard", () => {
    b.g(70, 0);
    b.g(40, 0);
    b.g(41, 1);
    b.g(50, 0);
    b.g(71, 0);
    b.g(42, 2.5);
    b.g(3, "txt");
    b.g(4, "");
  });
  endTable();

  // VIEW (empty)
  beginTable("VIEW", 0);
  endTable();

  // UCS (empty)
  beginTable("UCS", 0);
  endTable();

  // APPID
  const appidTable = beginTable("APPID", 1);
  tableEntry(b, "APPID", "AcDbRegAppTableRecord", appidTable, "ACAD", () => {
    b.g(70, 0);
  });
  endTable();

  // DIMSTYLE
  const dimstyleTable = beginTable("DIMSTYLE", 1);
  // DIMSTYLE has a non-standard subclass marker order; keep it minimal.
  {
    const h = b.nextHandle();
    b.g(0, "DIMSTYLE");
    b.g(105, h);
    b.g(330, dimstyleTable);
    b.g(100, "AcDbSymbolTableRecord");
    b.g(100, "AcDbDimStyleTableRecord");
    b.g(2, "Standard");
    b.g(70, 0);
  }
  endTable();

  // BLOCK_RECORD (*Model_Space, *Paper_Space)
  const blockRecordTable = beginTable("BLOCK_RECORD", 2);
  let modelSpace = "";
  let paperSpace = "";
  tableEntry(
    b,
    "BLOCK_RECORD",
    "AcDbBlockTableRecord",
    blockRecordTable,
    "*Model_Space",
    (h) => {
      modelSpace = h;
      b.g(70, 0);
      b.g(280, 1);
      b.g(281, 0);
    }
  );
  tableEntry(
    b,
    "BLOCK_RECORD",
    "AcDbBlockTableRecord",
    blockRecordTable,
    "*Paper_Space",
    (h) => {
      paperSpace = h;
      b.g(70, 0);
      b.g(280, 1);
      b.g(281, 0);
    }
  );
  endTable();

  b.g(0, "ENDSEC");
  return { blockRecordTable, modelSpace, paperSpace };
}

function writeBlock(
  b: DxfBuilder,
  name: string,
  ownerRecord: string,
  isPaper: boolean
): void {
  b.g(0, "BLOCK");
  b.g(5, b.nextHandle());
  b.g(330, ownerRecord);
  b.g(100, "AcDbEntity");
  if (isPaper) b.g(67, 1);
  b.g(8, "0");
  b.g(100, "AcDbBlockBegin");
  b.g(2, name);
  b.g(70, 0);
  b.g(10, 0);
  b.g(20, 0);
  b.g(30, 0);
  b.g(3, name);
  b.g(1, "");
  b.g(0, "ENDBLK");
  b.g(5, b.nextHandle());
  b.g(330, ownerRecord);
  b.g(100, "AcDbEntity");
  if (isPaper) b.g(67, 1);
  b.g(8, "0");
  b.g(100, "AcDbBlockEnd");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a single AC1015 DXF for a nested sheet. Each part's true geometry is
 * placed (rotated + translated) into its nested position; cut contours land on the
 * CUT layer, the sheet boundary on SHEET, and optional labels on LABEL.
 */
export function generateNestingDxf(
  sheet: NestingSheetInfo,
  parts: PlacedPart[],
  options: GenerateDxfOptions = {}
): string {
  const includeSheetOutline = options.includeSheetOutline ?? true;
  const includeLabels = options.includeLabels ?? true;

  // Build the full entity list (model space), placing each part.
  const entities: ExportEntity[] = [];

  if (includeSheetOutline) {
    entities.push({
      type: "LWPOLYLINE",
      layer: LAYER_SHEET,
      closed: true,
      vertices: [
        { x: 0, y: 0 },
        { x: sheet.width, y: 0 },
        { x: sheet.width, y: sheet.height },
        { x: 0, y: sheet.height },
      ],
    });
  }

  for (const part of parts) {
    if (!part.entities.length) continue;
    const placed = placeEntities(
      part.entities,
      part.placement.rotation,
      part.placement.x,
      part.placement.y
    ).map((e) => ({ ...e, layer: e.layer ?? LAYER_CUT }));
    entities.push(...placed);

    if (includeLabels && part.label) {
      const b = boundsForPlacement(placed);
      const h = Math.min(12, Math.max(4, (b.maxY - b.minY) * 0.12));
      entities.push({
        type: "TEXT",
        layer: LAYER_LABEL,
        position: { x: b.minX + h * 0.25, y: b.minY + h * 0.25 },
        height: h,
        value: part.label,
      });
    }
  }

  return serialize(sheet, entities);
}

function serialize(sheet: NestingSheetInfo, entities: ExportEntity[]): string {
  const b = new DxfBuilder();

  const usedLayers = new Set<string>([LAYER_CUT]);
  for (const e of entities) usedLayers.add(e.layer ?? LAYER_CUT);
  const layers = [...usedLayers].filter((l) => l !== "0");

  // TABLES first (allocates block-record handles we need for entity owners).
  // We must emit HEADER before TABLES, but HEADER needs $HANDSEED which depends on
  // the final handle count. So: build the body (tables/blocks/entities/objects) into
  // a temporary builder, then prepend the header with the resulting seed.
  const body = new DxfBuilder();
  const handles = writeTables(body, layers);

  // BLOCKS
  body.g(0, "SECTION");
  body.g(2, "BLOCKS");
  writeBlock(body, "*Model_Space", handles.modelSpace, false);
  writeBlock(body, "*Paper_Space", handles.paperSpace, true);
  body.g(0, "ENDSEC");

  // ENTITIES (owned by model space)
  body.g(0, "SECTION");
  body.g(2, "ENTITIES");
  for (const e of entities) writeEntity(body, e, handles.modelSpace);
  body.g(0, "ENDSEC");

  // OBJECTS (root dictionary + ACAD_GROUP)
  const rootDict = body.nextHandle();
  const groupDict = body.nextHandle();
  body.g(0, "SECTION");
  body.g(2, "OBJECTS");
  body.g(0, "DICTIONARY");
  body.g(5, rootDict);
  body.g(330, "0");
  body.g(100, "AcDbDictionary");
  body.g(281, 1);
  body.g(3, "ACAD_GROUP");
  body.g(350, groupDict);
  body.g(0, "DICTIONARY");
  body.g(5, groupDict);
  body.g(330, rootDict);
  body.g(100, "AcDbDictionary");
  body.g(281, 1);
  body.g(0, "ENDSEC");

  // HEADER + CLASSES go first (HEADER's $HANDSEED is the body's final seed), then the
  // body (tables/blocks/entities/objects), then EOF.
  b.g(0, "SECTION");
  b.g(2, "HEADER");
  b.g(9, "$ACADVER");
  b.g(1, "AC1015");
  b.g(9, "$HANDSEED");
  b.g(5, body.seed());
  b.g(9, "$INSUNITS");
  b.g(70, 4); // millimetres
  b.g(9, "$MEASUREMENT");
  b.g(70, 1); // metric
  b.g(9, "$LUNITS");
  b.g(70, 2); // decimal
  b.g(9, "$EXTMIN");
  b.g(10, 0);
  b.g(20, 0);
  b.g(30, 0);
  b.g(9, "$EXTMAX");
  b.g(10, fmt(sheet.width));
  b.g(20, fmt(sheet.height));
  b.g(30, 0);
  b.g(0, "ENDSEC");

  b.g(0, "SECTION");
  b.g(2, "CLASSES");
  b.g(0, "ENDSEC");

  return b.toString() + body.toString() + "0\nEOF\n";
}
