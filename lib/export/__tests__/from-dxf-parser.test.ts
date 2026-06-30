import { describe, it, expect } from "vitest";
import { parseOriginalDxfToEntities } from "../from-dxf-parser";

// Minimal hand-written DXF (entities-only is treated as R12 by parsers, which is fine
// for reading). Covers LINE, CIRCLE, ARC, LWPOLYLINE (with bulge), and ELLIPSE.
function dxf(insunits: number | null, entities: string): string {
  const header =
    insunits == null
      ? ""
      : ["0", "SECTION", "2", "HEADER", "9", "$INSUNITS", "70", String(insunits), "0", "ENDSEC"].join("\n") + "\n";
  return header + ["0", "SECTION", "2", "ENTITIES", entities, "0", "ENDSEC", "0", "EOF"].join("\n");
}

const LINE = ["0", "LINE", "8", "0", "10", "0", "20", "0", "11", "30", "21", "40"].join("\n");
const CIRCLE = ["0", "CIRCLE", "8", "0", "10", "10", "20", "10", "40", "5"].join("\n");
const ARC = ["0", "ARC", "8", "0", "10", "0", "20", "0", "40", "5", "50", "0", "51", "90"].join("\n");
const LWPOLY = [
  "0", "LWPOLYLINE", "8", "0", "90", "4", "70", "1",
  "10", "0", "20", "0", "42", "0.5",
  "10", "10", "20", "0",
  "10", "10", "20", "10",
  "10", "0", "20", "10",
].join("\n");
const ELLIPSE = [
  "0", "ELLIPSE", "8", "0",
  "10", "5", "20", "5",
  "11", "3", "21", "0",
  "40", "0.5",
  "41", "0",
  "42", "6.283185307",
].join("\n");

describe("parseOriginalDxfToEntities", () => {
  it("converts core entities with full fidelity (mm units)", () => {
    const entities = parseOriginalDxfToEntities(
      dxf(4, [LINE, CIRCLE, ARC, LWPOLY, ELLIPSE].join("\n"))
    );
    const byType = entities.reduce<Record<string, number>>((acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + 1;
      return acc;
    }, {});
    expect(byType).toMatchObject({
      LINE: 1,
      CIRCLE: 1,
      ARC: 1,
      LWPOLYLINE: 1,
      ELLIPSE: 1,
    });
  });

  it("keeps ARC angles in degrees (converted from dxf-parser radians)", () => {
    const [arc] = parseOriginalDxfToEntities(dxf(4, ARC));
    if (arc.type !== "ARC") throw new Error("expected arc");
    expect(arc.startAngle).toBeCloseTo(0, 6);
    expect(arc.endAngle).toBeCloseTo(90, 6);
    expect(arc.radius).toBe(5);
  });

  it("preserves LWPOLYLINE closed flag and bulge", () => {
    const [poly] = parseOriginalDxfToEntities(dxf(4, LWPOLY));
    if (poly.type !== "LWPOLYLINE") throw new Error("expected polyline");
    expect(poly.closed).toBe(true);
    expect(poly.vertices).toHaveLength(4);
    expect(poly.vertices[0].bulge).toBe(0.5);
  });

  it("scales inch drawings to millimetres ($INSUNITS=1)", () => {
    const [circle] = parseOriginalDxfToEntities(dxf(1, CIRCLE));
    if (circle.type !== "CIRCLE") throw new Error("expected circle");
    expect(circle.radius).toBeCloseTo(5 * 25.4, 6);
    expect(circle.center.x).toBeCloseTo(10 * 25.4, 6);
  });

  it("applies the unknown-units inch heuristic for small drawings", () => {
    // No $INSUNITS, tiny geometry (< 50) => treated as inches.
    const [circle] = parseOriginalDxfToEntities(dxf(null, CIRCLE));
    if (circle.type !== "CIRCLE") throw new Error("expected circle");
    expect(circle.radius).toBeCloseTo(5 * 25.4, 6);
  });

  it("throws on an empty DXF", () => {
    expect(() => parseOriginalDxfToEntities(dxf(4, ""))).toThrow();
  });
});
