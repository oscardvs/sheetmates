import { describe, it, expect } from "vitest";
import { parseSvgPathToEntities } from "../from-svg-path";
import { boundsForPlacement } from "../dxf-entities";

describe("parseSvgPathToEntities (legacy fallback)", () => {
  it("parses a closed rectangle into one closed polyline, un-mirroring Y", () => {
    // As emitted by lib/dxf/to-svg.ts for a 40x20 box (Y already flipped to Y-down).
    const path = "M 0 0 L 40 0 L 40 20 L 0 20 Z";
    const entities = parseSvgPathToEntities(path);
    expect(entities).toHaveLength(1);
    const e = entities[0];
    if (e.type !== "LWPOLYLINE") throw new Error("expected polyline");
    expect(e.closed).toBe(true);
    expect(e.vertices).toHaveLength(4);
    // Y is negated (un-mirror); footprint size is preserved.
    const b = boundsForPlacement(entities);
    expect(b.maxX - b.minX).toBeCloseTo(40, 6);
    expect(b.maxY - b.minY).toBeCloseTo(20, 6);
  });

  it("flattens an arc command into multiple segments spanning the arc", () => {
    // Semicircle from (0,0) to (20,0), radius 10.
    const path = "M 0 0 A 10 10 0 0 1 20 0";
    const entities = parseSvgPathToEntities(path);
    expect(entities).toHaveLength(1);
    const e = entities[0];
    if (e.type !== "LWPOLYLINE") throw new Error("expected polyline");
    // Start point + several sampled points.
    expect(e.vertices.length).toBeGreaterThan(4);
    const b = boundsForPlacement(entities);
    // The arc bulges 10 in one Y direction => height ~10.
    expect(b.maxY - b.minY).toBeCloseTo(10, 1);
    expect(b.maxX - b.minX).toBeCloseTo(20, 1);
  });

  it("splits multiple subpaths into separate polylines", () => {
    const path = "M 0 0 L 10 0 L 10 10 Z M 20 20 L 30 20 L 30 30 Z";
    const entities = parseSvgPathToEntities(path);
    expect(entities).toHaveLength(2);
  });

  it("flattens a cubic bezier curve", () => {
    const path = "M 0 0 C 0 10 10 10 10 0";
    const entities = parseSvgPathToEntities(path);
    expect(entities).toHaveLength(1);
    const e = entities[0];
    if (e.type !== "LWPOLYLINE") throw new Error("expected polyline");
    expect(e.vertices.length).toBeGreaterThan(2);
  });

  it("returns nothing for an empty path", () => {
    expect(parseSvgPathToEntities("")).toEqual([]);
  });
});
