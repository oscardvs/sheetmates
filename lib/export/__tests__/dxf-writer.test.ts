import { describe, it, expect } from "vitest";
import DxfParser from "dxf-parser";
import {
  generateNestingDxf,
  LAYER_CUT,
  LAYER_SHEET,
  LAYER_LABEL,
  type PlacedPart,
} from "../dxf-writer";
import type { ExportEntity } from "../dxf-entities";

// A 40x20 plate with a Ø8 hole — rectangle outline + circle, bbox origin at (0,0).
function plate(): ExportEntity[] {
  return [
    {
      type: "LWPOLYLINE",
      closed: true,
      vertices: [
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 20 },
        { x: 0, y: 20 },
      ],
    },
    { type: "CIRCLE", center: { x: 20, y: 10 }, radius: 4 },
  ];
}

const SHEET = { id: "sheet1", width: 3000, height: 1500, material: "steel" };

const PARTS: PlacedPart[] = [
  { partId: "A", entities: plate(), placement: { x: 0, y: 0, rotation: 0 }, label: "A" },
  { partId: "B", entities: plate(), placement: { x: 100, y: 50, rotation: 90 }, label: "B" },
];

function parse(dxf: string) {
  const parsed = new DxfParser().parseSync(dxf);
  if (!parsed) throw new Error("dxf-parser returned null");
  return parsed;
}

describe("generateNestingDxf", () => {
  it("emits a valid AC1015 DXF in millimetres", () => {
    const out = generateNestingDxf(SHEET, PARTS);
    expect(out).toContain("AC1015");
    // $INSUNITS = 4 (mm)
    expect(out).toMatch(/\$INSUNITS\n70\n4\n/);
    expect(out.trimEnd().endsWith("EOF")).toBe(true);
  });

  it("re-parses cleanly with dxf-parser", () => {
    const out = generateNestingDxf(SHEET, PARTS);
    const parsed = parse(out);
    expect(parsed).toBeTruthy();
    expect(parsed.entities.length).toBeGreaterThan(0);
  });

  it("places the sheet outline on the SHEET layer at sheet dimensions", () => {
    const out = generateNestingDxf(SHEET, PARTS);
    const parsed = parse(out);
    const outline = parsed.entities.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => e.layer === LAYER_SHEET && e.type === "LWPOLYLINE"
    );
    expect(outline).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xs = (outline as any).vertices.map((v: any) => v.x);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ys = (outline as any).vertices.map((v: any) => v.y);
    expect(Math.max(...xs)).toBeCloseTo(3000, 3);
    expect(Math.max(...ys)).toBeCloseTo(1500, 3);
  });

  it("places part A unrotated at the origin", () => {
    const out = generateNestingDxf(SHEET, PARTS);
    const parsed = parse(out);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cuts = parsed.entities.filter((e: any) => e.layer === LAYER_CUT);
    const rectA = cuts.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) =>
        e.type === "LWPOLYLINE" &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        e.vertices.some((v: any) => Math.abs(v.x - 40) < 1e-6 && Math.abs(v.y) < 1e-6)
    );
    expect(rectA).toBeTruthy();
    // Circle hole for part A at (20,10).
    const circleA = cuts.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) =>
        e.type === "CIRCLE" &&
        Math.abs(e.center.x - 20) < 1e-6 &&
        Math.abs(e.center.y - 10) < 1e-6
    );
    expect(circleA).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((circleA as any).radius).toBeCloseTo(4, 6);
  });

  it("places part B rotated 90° at (100,50) with the hole transformed", () => {
    const out = generateNestingDxf(SHEET, PARTS);
    const parsed = parse(out);
    // After rot90 + place at (100,50): rectangle occupies x∈[100,120], y∈[50,90];
    // circle centre moves to (110,70).
    const circleB = parsed.entities.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) =>
        e.type === "CIRCLE" &&
        Math.abs(e.center.x - 110) < 1e-6 &&
        Math.abs(e.center.y - 70) < 1e-6
    );
    expect(circleB).toBeTruthy();
  });

  it("emits one TEXT label per part on the LABEL layer", () => {
    const out = generateNestingDxf(SHEET, PARTS);
    const parsed = parse(out);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labels = parsed.entities.filter((e: any) => e.layer === LAYER_LABEL);
    expect(labels.length).toBe(2);
  });

  it("omits the sheet outline and labels when disabled", () => {
    const out = generateNestingDxf(SHEET, PARTS, {
      includeSheetOutline: false,
      includeLabels: false,
    });
    const parsed = parse(out);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parsed.entities.some((e: any) => e.layer === LAYER_SHEET)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parsed.entities.some((e: any) => e.layer === LAYER_LABEL)).toBe(false);
  });
});
