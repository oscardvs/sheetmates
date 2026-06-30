import { describe, it, expect } from "vitest";
import { placeEntities } from "../dxf-transform";
import type { ExportEntity } from "../dxf-entities";

function rect(): ExportEntity {
  // 10 (wide) x 4 (tall) rectangle, bbox origin at (0,0).
  return {
    type: "LWPOLYLINE",
    closed: true,
    vertices: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 4 },
      { x: 0, y: 4 },
    ],
  };
}

describe("placeEntities", () => {
  it("translates with no rotation so bbox min lands at the target", () => {
    const [out] = placeEntities([rect()], 0, 5, 7);
    expect(out.type).toBe("LWPOLYLINE");
    if (out.type !== "LWPOLYLINE") return;
    expect(out.vertices).toEqual([
      { x: 5, y: 7, bulge: undefined },
      { x: 15, y: 7, bulge: undefined },
      { x: 15, y: 11, bulge: undefined },
      { x: 5, y: 11, bulge: undefined },
    ]);
  });

  it("rotates 90° CCW, swapping the footprint and aligning to the target", () => {
    const [out] = placeEntities([rect()], 90, 0, 0);
    if (out.type !== "LWPOLYLINE") throw new Error("expected polyline");
    const round = out.vertices.map((v) => ({
      x: Math.round(v.x * 1e6) / 1e6,
      y: Math.round(v.y * 1e6) / 1e6,
    }));
    // 10x4 rotated to 4x10, lower-left at origin.
    expect(round).toEqual([
      { x: 4, y: 0 },
      { x: 4, y: 10 },
      { x: 0, y: 10 },
      { x: 0, y: 0 },
    ]);
  });

  it("keeps bulge values intact under rotation (rotation-invariant)", () => {
    const poly: ExportEntity = {
      type: "LWPOLYLINE",
      closed: true,
      vertices: [
        { x: 0, y: 0, bulge: 0.5 },
        { x: 10, y: 0 },
        { x: 10, y: 4 },
        { x: 0, y: 4 },
      ],
    };
    const [out] = placeEntities([poly], 90, 0, 0);
    if (out.type !== "LWPOLYLINE") throw new Error("expected polyline");
    expect(out.vertices[0].bulge).toBe(0.5);
  });

  it("shifts ARC start/end angles by the rotation and moves the centre", () => {
    const arc: ExportEntity = {
      type: "ARC",
      center: { x: 5, y: 2 },
      radius: 2,
      startAngle: 0,
      endAngle: 90,
    };
    const [out] = placeEntities([arc], 90, 0, 0);
    if (out.type !== "ARC") throw new Error("expected arc");
    expect(out.startAngle).toBeCloseTo(90, 6);
    expect(out.endAngle).toBeCloseTo(180, 6);
    expect(out.radius).toBe(2);
  });

  it("rotates an ELLIPSE's centre-relative major axis", () => {
    const ell: ExportEntity = {
      type: "ELLIPSE",
      center: { x: 5, y: 5 },
      majorAxisEnd: { x: 3, y: 0 },
      axisRatio: 0.5,
      startParam: 0,
      endParam: Math.PI * 2,
    };
    const [out] = placeEntities([ell], 90, 0, 0);
    if (out.type !== "ELLIPSE") throw new Error("expected ellipse");
    // (3,0) rotated 90° CCW -> (0,3)
    expect(out.majorAxisEnd.x).toBeCloseTo(0, 6);
    expect(out.majorAxisEnd.y).toBeCloseTo(3, 6);
    expect(out.axisRatio).toBe(0.5);
  });

  it("preserves a circle's radius and places its bbox correctly", () => {
    const circle: ExportEntity = {
      type: "CIRCLE",
      center: { x: 5, y: 5 },
      radius: 5,
    };
    // bbox is [0,10]x[0,10]; target (20,30) => centre at (25,35).
    const [out] = placeEntities([circle], 0, 20, 30);
    if (out.type !== "CIRCLE") throw new Error("expected circle");
    expect(out.center.x).toBeCloseTo(25, 6);
    expect(out.center.y).toBeCloseTo(35, 6);
    expect(out.radius).toBe(5);
  });
});
