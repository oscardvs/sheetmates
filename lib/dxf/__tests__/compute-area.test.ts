import { describe, it, expect } from "vitest";
import { computeArea } from "../compute-area";
import type { ParsedDxf } from "../parser";

// Helper to create a minimal parsed DXF
function createParsedDxf(
  entities: ParsedDxf["entities"],
  width = 100,
  height = 100
): ParsedDxf {
  return {
    entities,
    width,
    height,
    minX: 0,
    minY: 0,
    maxX: width,
    maxY: height,
  };
}

describe("computeArea", () => {
  describe("circle area", () => {
    it("calculates circle area correctly", () => {
      const parsed = createParsedDxf([
        { type: "CIRCLE", radius: 10 },
      ]);

      // π * 10² = 314.159...
      expect(computeArea(parsed)).toBeCloseTo(Math.PI * 100);
    });

    it("handles circle with radius 0", () => {
      const parsed = createParsedDxf([
        { type: "CIRCLE", radius: 0 },
      ]);

      expect(computeArea(parsed)).toBe(0);
    });

    it("handles large circle", () => {
      const parsed = createParsedDxf([
        { type: "CIRCLE", radius: 500 },
      ]);

      expect(computeArea(parsed)).toBeCloseTo(Math.PI * 250000);
    });
  });

  describe("closed polyline area (Shoelace)", () => {
    it("calculates square area", () => {
      // 100x100 square
      const parsed = createParsedDxf([
        {
          type: "LWPOLYLINE",
          vertices: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
            { x: 0, y: 0 }, // Closed
          ],
        },
      ]);

      expect(computeArea(parsed)).toBeCloseTo(10000);
    });

    it("calculates triangle area", () => {
      // Right triangle with base 100, height 100
      const parsed = createParsedDxf([
        {
          type: "LWPOLYLINE",
          vertices: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 0, y: 100 },
            { x: 0, y: 0 }, // Closed
          ],
        },
      ]);

      // Area = 0.5 * 100 * 100 = 5000
      expect(computeArea(parsed)).toBeCloseTo(5000);
    });

    it("calculates irregular polygon area", () => {
      // L-shaped polygon
      const parsed = createParsedDxf([
        {
          type: "POLYLINE",
          vertices: [
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 50 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
            { x: 0, y: 0 }, // Closed
          ],
        },
      ]);

      // L-shape area: 100*100 - 50*50 = 7500
      expect(computeArea(parsed)).toBeCloseTo(7500);
    });
  });

  describe("open polyline (fallback to bounding box)", () => {
    it("uses bounding box for open polyline", () => {
      const parsed = createParsedDxf(
        [
          {
            type: "LWPOLYLINE",
            vertices: [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
              { x: 50, y: 50 }, // Not closed
            ],
          },
        ],
        200,
        200
      );

      // Falls back to width * height = 200 * 200 = 40000
      expect(computeArea(parsed)).toBe(40000);
    });
  });

  describe("LINE entities (fallback to bounding box)", () => {
    it("uses bounding box for LINE entities", () => {
      const parsed = createParsedDxf(
        [
          {
            type: "LINE",
            startPoint: { x: 0, y: 0, z: 0 },
            endPoint: { x: 100, y: 100, z: 0 },
          },
        ],
        150,
        150
      );

      expect(computeArea(parsed)).toBe(22500); // 150 * 150
    });
  });

  describe("mixed entities", () => {
    it("returns area of first valid entity found", () => {
      // Circle is listed first, so its area is returned
      const parsed = createParsedDxf([
        { type: "CIRCLE", radius: 10 }, // π * 100 ≈ 314
        {
          type: "LWPOLYLINE",
          vertices: [
            { x: 0, y: 0 },
            { x: 200, y: 0 },
            { x: 200, y: 200 },
            { x: 0, y: 200 },
            { x: 0, y: 0 },
          ],
        }, // 40000
      ]);

      // Circle is encountered first in the loop, so its area is returned
      expect(computeArea(parsed)).toBeCloseTo(Math.PI * 100);
    });

    it("prioritizes closed polyline when it comes first", () => {
      const parsed = createParsedDxf([
        {
          type: "LWPOLYLINE",
          vertices: [
            { x: 0, y: 0 },
            { x: 200, y: 0 },
            { x: 200, y: 200 },
            { x: 0, y: 200 },
            { x: 0, y: 0 },
          ],
        }, // 40000
        { type: "CIRCLE", radius: 10 }, // π * 100 ≈ 314
      ]);

      // Polyline is first, so its area is returned
      expect(computeArea(parsed)).toBeCloseTo(40000);
    });
  });

  describe("edge cases", () => {
    it("handles empty entities", () => {
      const parsed = createParsedDxf([], 100, 100);

      // Falls back to bounding box
      expect(computeArea(parsed)).toBe(10000);
    });

    it("handles polyline with fewer than 3 vertices", () => {
      const parsed = createParsedDxf(
        [
          {
            type: "LWPOLYLINE",
            vertices: [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
            ],
          },
        ],
        100,
        100
      );

      // Falls back to bounding box
      expect(computeArea(parsed)).toBe(10000);
    });

    it("handles zero dimensions", () => {
      const parsed = createParsedDxf([], 0, 0);

      expect(computeArea(parsed)).toBe(0);
    });
  });
});
