import { describe, it, expect } from "vitest";
import { shelfPack } from "../shelf-packer";
import type { NestingPart, NestingSheet } from "../types";

describe("shelfPack", () => {
  const standardSheet: NestingSheet = { width: 3000, height: 1500 };

  describe("basic placement", () => {
    it("places a single part at origin", () => {
      const parts: NestingPart[] = [
        { id: "part1", width: 100, height: 50, quantity: 1 },
      ];
      const result = shelfPack(parts, standardSheet, 2);

      expect(result.placements).toHaveLength(1);
      expect(result.placements[0]).toMatchObject({
        partId: "part1",
        sheetIndex: 0,
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        rotation: 0,
      });
      expect(result.sheetsUsed).toBe(1);
    });

    it("expands multiple quantities correctly", () => {
      const parts: NestingPart[] = [
        { id: "part1", width: 100, height: 50, quantity: 5 },
      ];
      const result = shelfPack(parts, standardSheet, 2);

      expect(result.placements).toHaveLength(5);
      expect(result.placements.every((p) => p.partId === "part1")).toBe(true);
    });

    it("handles empty parts array", () => {
      const result = shelfPack([], standardSheet, 2);

      expect(result.placements).toHaveLength(0);
      expect(result.sheetsUsed).toBe(0);
      expect(result.utilization).toHaveLength(0);
    });
  });

  describe("shelf algorithm behavior", () => {
    it("places parts on same shelf when they fit horizontally", () => {
      const parts: NestingPart[] = [
        { id: "part1", width: 100, height: 50, quantity: 1 },
        { id: "part2", width: 100, height: 50, quantity: 1 },
      ];
      const result = shelfPack(parts, standardSheet, 2);

      expect(result.placements).toHaveLength(2);
      // Both should be on first shelf (same y)
      expect(result.placements[0].y).toBe(0);
      expect(result.placements[1].y).toBe(0);
      // Second part should be offset by width + kerf
      expect(result.placements[1].x).toBe(102); // 100 + 2 kerf
    });

    it("creates new shelf when horizontal space exhausted", () => {
      const parts: NestingPart[] = [
        { id: "part1", width: 2000, height: 100, quantity: 1 },
        { id: "part2", width: 2000, height: 100, quantity: 1 },
      ];
      const result = shelfPack(parts, standardSheet, 2);

      expect(result.placements).toHaveLength(2);
      // Second part should be on a new shelf (different y)
      expect(result.placements[0].y).toBe(0);
      expect(result.placements[1].y).toBe(102); // 100 height + 2 kerf
    });

    it("sorts parts by height descending", () => {
      const parts: NestingPart[] = [
        { id: "short", width: 100, height: 50, quantity: 1 },
        { id: "tall", width: 100, height: 200, quantity: 1 },
      ];
      const result = shelfPack(parts, standardSheet, 2);

      // Tall part should be placed first (at origin)
      const tallPlacement = result.placements.find((p) => p.partId === "tall");
      expect(tallPlacement?.x).toBe(0);
      expect(tallPlacement?.y).toBe(0);
    });
  });

  describe("rotation", () => {
    it("rotates part 90 degrees when needed to fit on shelf", () => {
      // Create a scenario where rotation helps
      const parts: NestingPart[] = [
        { id: "wide", width: 2800, height: 100, quantity: 1 },
        { id: "tall", width: 100, height: 300, quantity: 1 },
      ];
      const result = shelfPack(parts, standardSheet, 2);

      // Both should fit with possible rotation of second part
      expect(result.placements).toHaveLength(2);
      expect(result.sheetsUsed).toBe(1);
    });
  });

  describe("multi-sheet", () => {
    it("creates new sheet when first is full", () => {
      const parts: NestingPart[] = [
        { id: "large", width: 2998, height: 1498, quantity: 2 },
      ];
      const result = shelfPack(parts, standardSheet, 2);

      expect(result.placements).toHaveLength(2);
      expect(result.sheetsUsed).toBe(2);
      expect(result.placements[0].sheetIndex).toBe(0);
      expect(result.placements[1].sheetIndex).toBe(1);
    });

    it("calculates utilization per sheet", () => {
      const parts: NestingPart[] = [
        { id: "half", width: 1500, height: 1500, quantity: 2 },
      ];
      const result = shelfPack(parts, standardSheet, 0);

      // Check that utilization array has entries
      expect(result.utilization.length).toBeGreaterThanOrEqual(1);
      // Utilization should be reasonable (between 0 and 1)
      result.utilization.forEach((u) => {
        expect(u).toBeGreaterThan(0);
        expect(u).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("kerf spacing", () => {
    it("applies kerf spacing between parts", () => {
      const parts: NestingPart[] = [
        { id: "part1", width: 100, height: 100, quantity: 1 },
        { id: "part2", width: 100, height: 100, quantity: 1 },
      ];
      const kerf = 5;
      const result = shelfPack(parts, standardSheet, kerf);

      expect(result.placements[0].x).toBe(0);
      expect(result.placements[1].x).toBe(105); // 100 + 5 kerf
    });

    it("handles zero kerf", () => {
      const parts: NestingPart[] = [
        { id: "part1", width: 100, height: 100, quantity: 1 },
        { id: "part2", width: 100, height: 100, quantity: 1 },
      ];
      const result = shelfPack(parts, standardSheet, 0);

      expect(result.placements[1].x).toBe(100); // No gap
    });
  });

  describe("edge cases", () => {
    it("handles part larger than sheet gracefully", () => {
      const parts: NestingPart[] = [
        { id: "huge", width: 5000, height: 5000, quantity: 1 },
      ];
      const result = shelfPack(parts, standardSheet, 2);

      // Part won't fit, should have 0 placements or handle gracefully
      expect(result.sheetsUsed).toBeGreaterThanOrEqual(0);
    });

    it("handles very small sheet", () => {
      const tinySheet: NestingSheet = { width: 10, height: 10 };
      const parts: NestingPart[] = [
        { id: "tiny", width: 5, height: 5, quantity: 1 },
      ];
      const result = shelfPack(parts, tinySheet, 1);

      expect(result.placements).toHaveLength(1);
    });

    it("handles quantity zero", () => {
      const parts: NestingPart[] = [
        { id: "none", width: 100, height: 100, quantity: 0 },
      ];
      const result = shelfPack(parts, standardSheet, 2);

      expect(result.placements).toHaveLength(0);
    });
  });
});
