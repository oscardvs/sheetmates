import { describe, it, expect } from "vitest";
import { computeCutLength } from "../compute-cut-length";
import type { ParsedDxf } from "../parser";

// Helper to create a minimal parsed DXF
function createParsedDxf(entities: ParsedDxf["entities"]): ParsedDxf {
  return {
    entities,
    width: 100,
    height: 100,
    minX: 0,
    minY: 0,
    maxX: 100,
    maxY: 100,
  };
}

describe("computeCutLength", () => {
  describe("LINE entities", () => {
    it("calculates horizontal line length", () => {
      const parsed = createParsedDxf([
        {
          type: "LINE",
          startPoint: { x: 0, y: 0, z: 0 },
          endPoint: { x: 100, y: 0, z: 0 },
        },
      ]);

      expect(computeCutLength(parsed)).toBeCloseTo(100);
    });

    it("calculates vertical line length", () => {
      const parsed = createParsedDxf([
        {
          type: "LINE",
          startPoint: { x: 0, y: 0, z: 0 },
          endPoint: { x: 0, y: 50, z: 0 },
        },
      ]);

      expect(computeCutLength(parsed)).toBeCloseTo(50);
    });

    it("calculates diagonal line length", () => {
      const parsed = createParsedDxf([
        {
          type: "LINE",
          startPoint: { x: 0, y: 0, z: 0 },
          endPoint: { x: 30, y: 40, z: 0 },
        },
      ]);

      // 3-4-5 triangle: √(30² + 40²) = 50
      expect(computeCutLength(parsed)).toBeCloseTo(50);
    });

    it("sums multiple lines", () => {
      const parsed = createParsedDxf([
        {
          type: "LINE",
          startPoint: { x: 0, y: 0, z: 0 },
          endPoint: { x: 100, y: 0, z: 0 },
        },
        {
          type: "LINE",
          startPoint: { x: 100, y: 0, z: 0 },
          endPoint: { x: 100, y: 50, z: 0 },
        },
      ]);

      expect(computeCutLength(parsed)).toBeCloseTo(150);
    });
  });

  describe("CIRCLE entities", () => {
    it("calculates circle circumference", () => {
      const parsed = createParsedDxf([{ type: "CIRCLE", radius: 10 }]);

      // 2πr = 2π * 10 ≈ 62.83
      expect(computeCutLength(parsed)).toBeCloseTo(2 * Math.PI * 10);
    });

    it("handles zero radius circle", () => {
      const parsed = createParsedDxf([{ type: "CIRCLE", radius: 0 }]);

      expect(computeCutLength(parsed)).toBe(0);
    });
  });

  describe("ARC entities", () => {
    it("calculates full semicircle arc", () => {
      const parsed = createParsedDxf([
        {
          type: "ARC",
          radius: 10,
          startAngle: 0,
          endAngle: 180,
        },
      ]);

      // Half circumference: π * 10 ≈ 31.42
      expect(computeCutLength(parsed)).toBeCloseTo(Math.PI * 10);
    });

    it("calculates quarter arc", () => {
      const parsed = createParsedDxf([
        {
          type: "ARC",
          radius: 10,
          startAngle: 0,
          endAngle: 90,
        },
      ]);

      // Quarter: (90/360) * 2π * 10 = π * 10 / 2 ≈ 15.71
      expect(computeCutLength(parsed)).toBeCloseTo((Math.PI * 10) / 2);
    });

    it("handles arc crossing 0 degrees", () => {
      const parsed = createParsedDxf([
        {
          type: "ARC",
          radius: 10,
          startAngle: 270,
          endAngle: 90, // 180 degrees crossing 0
        },
      ]);

      // Should handle negative difference correctly
      expect(computeCutLength(parsed)).toBeGreaterThan(0);
    });
  });

  describe("POLYLINE/LWPOLYLINE entities", () => {
    it("calculates closed rectangle perimeter", () => {
      const parsed = createParsedDxf([
        {
          type: "LWPOLYLINE",
          vertices: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 50 },
            { x: 0, y: 50 },
            { x: 0, y: 0 }, // Back to start
          ],
        },
      ]);

      // Perimeter: 100 + 50 + 100 + 50 = 300
      expect(computeCutLength(parsed)).toBeCloseTo(300);
    });

    it("calculates open polyline length", () => {
      const parsed = createParsedDxf([
        {
          type: "POLYLINE",
          vertices: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 50 },
          ],
        },
      ]);

      // 100 + 50 = 150 (not closed)
      expect(computeCutLength(parsed)).toBeCloseTo(150);
    });

    it("handles polyline with fewer than 2 vertices", () => {
      const parsed = createParsedDxf([
        {
          type: "LWPOLYLINE",
          vertices: [{ x: 0, y: 0 }],
        },
      ]);

      expect(computeCutLength(parsed)).toBe(0);
    });
  });

  describe("ELLIPSE entities", () => {
    it("calculates ellipse perimeter (Ramanujan approximation)", () => {
      const parsed = createParsedDxf([
        {
          type: "ELLIPSE",
          majorAxisEndPoint: { x: 20, y: 0, z: 0 }, // a = 20
          axisRatio: 0.5, // b = 10
        },
      ]);

      const a = 20;
      const b = 10;
      // Ramanujan: π * (3(a+b) - √((3a+b)(a+3b)))
      const expected =
        Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
      expect(computeCutLength(parsed)).toBeCloseTo(expected);
    });

    it("handles ellipse with axisRatio 1 (circle)", () => {
      const parsed = createParsedDxf([
        {
          type: "ELLIPSE",
          majorAxisEndPoint: { x: 10, y: 0, z: 0 },
          axisRatio: 1,
        },
      ]);

      // Should be close to circle circumference: 2π * 10
      expect(computeCutLength(parsed)).toBeCloseTo(2 * Math.PI * 10);
    });
  });

  describe("SPLINE entities", () => {
    it("calculates approximate spline length from control points", () => {
      const parsed = createParsedDxf([
        {
          type: "SPLINE",
          controlPoints: [
            { x: 0, y: 0, z: 0 },
            { x: 100, y: 0, z: 0 },
            { x: 100, y: 100, z: 0 },
          ],
        },
      ]);

      // Sum of control point segments: 100 + 100 = 200
      expect(computeCutLength(parsed)).toBeCloseTo(200);
    });

    it("handles spline with fewer than 2 control points", () => {
      const parsed = createParsedDxf([
        {
          type: "SPLINE",
          controlPoints: [{ x: 0, y: 0, z: 0 }],
        },
      ]);

      expect(computeCutLength(parsed)).toBe(0);
    });
  });

  describe("mixed entities", () => {
    it("sums all entity types", () => {
      const parsed = createParsedDxf([
        {
          type: "LINE",
          startPoint: { x: 0, y: 0, z: 0 },
          endPoint: { x: 100, y: 0, z: 0 },
        }, // 100
        { type: "CIRCLE", radius: 10 }, // 2π * 10 ≈ 62.83
      ]);

      expect(computeCutLength(parsed)).toBeCloseTo(100 + 2 * Math.PI * 10);
    });
  });

  describe("edge cases", () => {
    it("returns 0 for empty entities", () => {
      const parsed = createParsedDxf([]);

      expect(computeCutLength(parsed)).toBe(0);
    });

    it("handles missing start/end points", () => {
      const parsed = createParsedDxf([
        {
          type: "LINE",
          // Missing startPoint and endPoint
        } as ParsedDxf["entities"][0],
      ]);

      expect(computeCutLength(parsed)).toBe(0);
    });

    it("handles unknown entity types gracefully", () => {
      const parsed = createParsedDxf([
        { type: "UNKNOWN" } as ParsedDxf["entities"][0],
      ]);

      expect(computeCutLength(parsed)).toBe(0);
    });
  });
});
