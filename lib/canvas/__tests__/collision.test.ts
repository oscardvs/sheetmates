import { describe, it, expect } from "vitest";
import {
  getBoundingBox,
  checkCollision,
  checkPartCollisions,
  isOutOfBounds,
  calculateUtilization,
} from "../collision";
import type { CanvasPart } from "@/lib/stores/canvas-store";

// Helper to create a test part
function createPart(overrides: Partial<CanvasPart> = {}): CanvasPart {
  return {
    id: "test-id",
    partId: "test-part",
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    rotation: 0,
    isSelected: false,
    ...overrides,
  };
}

describe("getBoundingBox", () => {
  it("returns original dimensions for 0 rotation", () => {
    const part = createPart({ width: 100, height: 50, rotation: 0 });
    const box = getBoundingBox(part);

    expect(box).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it("swaps width/height for 90 degree rotation", () => {
    const part = createPart({ width: 100, height: 50, rotation: 90 });
    const box = getBoundingBox(part);

    expect(box).toEqual({ x: 0, y: 0, width: 50, height: 100 });
  });

  it("returns original dimensions for 180 rotation", () => {
    const part = createPart({ width: 100, height: 50, rotation: 180 });
    const box = getBoundingBox(part);

    expect(box).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it("swaps width/height for 270 degree rotation", () => {
    const part = createPart({ width: 100, height: 50, rotation: 270 });
    const box = getBoundingBox(part);

    expect(box).toEqual({ x: 0, y: 0, width: 50, height: 100 });
  });

  it("preserves position", () => {
    const part = createPart({ x: 50, y: 75, rotation: 90 });
    const box = getBoundingBox(part);

    expect(box.x).toBe(50);
    expect(box.y).toBe(75);
  });
});

describe("checkCollision", () => {
  it("returns true for overlapping boxes", () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };

    expect(checkCollision(a, b)).toBe(true);
  });

  it("returns false for non-overlapping boxes", () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 200, y: 200, width: 100, height: 100 };

    expect(checkCollision(a, b)).toBe(false);
  });

  it("returns false for adjacent boxes (touching edges)", () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 100, y: 0, width: 100, height: 100 };

    expect(checkCollision(a, b)).toBe(false);
  });

  it("handles box fully inside another", () => {
    const outer = { x: 0, y: 0, width: 200, height: 200 };
    const inner = { x: 50, y: 50, width: 50, height: 50 };

    expect(checkCollision(outer, inner)).toBe(true);
    expect(checkCollision(inner, outer)).toBe(true);
  });

  it("handles zero-size boxes", () => {
    // A point (zero-size box) inside another box is considered a collision
    const a = { x: 50, y: 50, width: 0, height: 0 };
    const b = { x: 0, y: 0, width: 100, height: 100 };

    // Implementation treats this as a collision since point is inside box
    expect(checkCollision(a, b)).toBe(true);
  });
});

describe("checkPartCollisions", () => {
  it("returns false when target has no collisions", () => {
    const parts: CanvasPart[] = [
      createPart({ id: "1", x: 0, y: 0 }),
      createPart({ id: "2", x: 200, y: 200 }),
    ];

    expect(checkPartCollisions(parts, "1")).toBe(false);
  });

  it("returns true when target collides with another part", () => {
    const parts: CanvasPart[] = [
      createPart({ id: "1", x: 0, y: 0, width: 100, height: 100 }),
      createPart({ id: "2", x: 50, y: 50, width: 100, height: 100 }),
    ];

    expect(checkPartCollisions(parts, "1")).toBe(true);
    expect(checkPartCollisions(parts, "2")).toBe(true);
  });

  it("returns false for non-existent target", () => {
    const parts: CanvasPart[] = [createPart({ id: "1" })];

    expect(checkPartCollisions(parts, "nonexistent")).toBe(false);
  });

  it("ignores self-collision", () => {
    const parts: CanvasPart[] = [createPart({ id: "1", x: 0, y: 0 })];

    expect(checkPartCollisions(parts, "1")).toBe(false);
  });
});

describe("isOutOfBounds", () => {
  const sheetWidth = 1000;
  const sheetHeight = 500;

  it("returns false for part fully inside sheet", () => {
    const part = createPart({ x: 100, y: 100, width: 50, height: 50 });

    expect(isOutOfBounds(part, sheetWidth, sheetHeight)).toBe(false);
  });

  it("returns true for part extending past right edge", () => {
    const part = createPart({ x: 980, y: 100, width: 50, height: 50 });

    expect(isOutOfBounds(part, sheetWidth, sheetHeight)).toBe(true);
  });

  it("returns true for part extending past bottom edge", () => {
    const part = createPart({ x: 100, y: 480, width: 50, height: 50 });

    expect(isOutOfBounds(part, sheetWidth, sheetHeight)).toBe(true);
  });

  it("returns true for part with negative x", () => {
    const part = createPart({ x: -10, y: 100 });

    expect(isOutOfBounds(part, sheetWidth, sheetHeight)).toBe(true);
  });

  it("returns true for part with negative y", () => {
    const part = createPart({ x: 100, y: -10 });

    expect(isOutOfBounds(part, sheetWidth, sheetHeight)).toBe(true);
  });

  it("returns false for part at origin", () => {
    const part = createPart({ x: 0, y: 0, width: 100, height: 100 });

    expect(isOutOfBounds(part, sheetWidth, sheetHeight)).toBe(false);
  });

  it("returns false for part exactly at sheet boundary", () => {
    const part = createPart({ x: 950, y: 450, width: 50, height: 50 });

    expect(isOutOfBounds(part, sheetWidth, sheetHeight)).toBe(false);
  });

  it("handles rotated parts", () => {
    // 100x50 part rotated 90 degrees becomes 50x100
    const part = createPart({
      x: 950,
      y: 100,
      width: 100,
      height: 50,
      rotation: 90,
    });
    // After rotation: width=50, height=100, so fits within 950+50=1000

    expect(isOutOfBounds(part, sheetWidth, sheetHeight)).toBe(false);
  });
});

describe("calculateUtilization", () => {
  it("returns 0 for empty parts array", () => {
    expect(calculateUtilization([], 1000, 500)).toBe(0);
  });

  it("returns 0 for zero sheet area", () => {
    const parts = [createPart({ width: 100, height: 100 })];

    expect(calculateUtilization(parts, 0, 500)).toBe(0);
    expect(calculateUtilization(parts, 1000, 0)).toBe(0);
  });

  it("calculates correct utilization percentage", () => {
    const parts = [
      createPart({ width: 500, height: 250 }), // 125,000 mm²
    ];
    // Sheet area: 1000 * 500 = 500,000 mm²
    // Utilization: 125,000 / 500,000 = 0.25

    expect(calculateUtilization(parts, 1000, 500)).toBeCloseTo(0.25);
  });

  it("sums areas of multiple parts", () => {
    const parts = [
      createPart({ id: "1", width: 100, height: 100 }), // 10,000
      createPart({ id: "2", width: 100, height: 100 }), // 10,000
    ];
    // Total: 20,000 / 500,000 = 0.04

    expect(calculateUtilization(parts, 1000, 500)).toBeCloseTo(0.04);
  });

  it("can return utilization > 1 if parts exceed sheet", () => {
    const parts = [
      createPart({ width: 2000, height: 1000 }), // 2,000,000
    ];
    // Utilization: 2,000,000 / 500,000 = 4

    expect(calculateUtilization(parts, 1000, 500)).toBeCloseTo(4);
  });
});
