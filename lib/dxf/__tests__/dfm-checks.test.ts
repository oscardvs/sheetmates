import { describe, it, expect } from "vitest";
import {
  checkDfm,
  checkHoleDiameter,
  checkMinFeatureSize,
  checkSharpCorners,
  checkOpenContours,
  checkAspectRatio,
  getDfmSummary,
  type DfmIssue,
} from "../dfm-checks";
import type { ParsedDxf, DxfEntity } from "../parser";

// Helper to create a minimal parsed DXF
function createParsedDxf(
  entities: DxfEntity[],
  width = 100,
  height = 100
): ParsedDxf {
  return {
    entities,
    boundingBox: { minX: 0, minY: 0, maxX: width, maxY: height },
    width,
    height,
  };
}

describe("checkHoleDiameter", () => {
  it("flags hole smaller than material thickness", () => {
    const entity: DxfEntity = {
      type: "CIRCLE",
      center: { x: 50, y: 50 },
      radius: 1, // diameter = 2mm
    };

    const issues = checkHoleDiameter(entity, 0, 3); // 3mm thickness

    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("hole_too_small");
    expect(issues[0].severity).toBe("error");
    expect(issues[0].value).toBe(2);
    expect(issues[0].limit).toBe(3);
  });

  it("passes hole equal to material thickness", () => {
    const entity: DxfEntity = {
      type: "CIRCLE",
      center: { x: 50, y: 50 },
      radius: 1.5, // diameter = 3mm
    };

    const issues = checkHoleDiameter(entity, 0, 3);

    expect(issues).toHaveLength(0);
  });

  it("passes hole larger than material thickness", () => {
    const entity: DxfEntity = {
      type: "CIRCLE",
      center: { x: 50, y: 50 },
      radius: 5, // diameter = 10mm
    };

    const issues = checkHoleDiameter(entity, 0, 3);

    expect(issues).toHaveLength(0);
  });

  it("ignores non-circle entities", () => {
    const entity: DxfEntity = {
      type: "LINE",
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 10, y: 10 },
    };

    const issues = checkHoleDiameter(entity, 0, 3);

    expect(issues).toHaveLength(0);
  });

  it("includes location in issue", () => {
    const entity: DxfEntity = {
      type: "CIRCLE",
      center: { x: 25, y: 75 },
      radius: 0.5, // diameter = 1mm
    };

    const issues = checkHoleDiameter(entity, 0, 2);

    expect(issues[0].location).toEqual({ x: 25, y: 75 });
  });
});

describe("checkMinFeatureSize", () => {
  describe("circles", () => {
    it("flags small circles", () => {
      const entity: DxfEntity = {
        type: "CIRCLE",
        center: { x: 50, y: 50 },
        radius: 0.2, // diameter = 0.4mm
      };

      const issues = checkMinFeatureSize(entity, 0, 0.5);

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe("feature_too_small");
      expect(issues[0].severity).toBe("warning");
    });

    it("passes circles above minimum", () => {
      const entity: DxfEntity = {
        type: "CIRCLE",
        center: { x: 50, y: 50 },
        radius: 1, // diameter = 2mm
      };

      const issues = checkMinFeatureSize(entity, 0, 0.5);

      expect(issues).toHaveLength(0);
    });
  });

  describe("lines", () => {
    it("flags short lines", () => {
      const entity: DxfEntity = {
        type: "LINE",
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 0.3, y: 0 }, // 0.3mm length
      };

      const issues = checkMinFeatureSize(entity, 0, 0.5);

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe("feature_too_small");
    });

    it("passes lines above minimum", () => {
      const entity: DxfEntity = {
        type: "LINE",
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 10, y: 0 },
      };

      const issues = checkMinFeatureSize(entity, 0, 0.5);

      expect(issues).toHaveLength(0);
    });
  });

  describe("polylines", () => {
    it("flags short polyline segments", () => {
      const entity: DxfEntity = {
        type: "LWPOLYLINE",
        vertices: [
          { x: 0, y: 0 },
          { x: 0.2, y: 0 }, // 0.2mm segment
          { x: 10, y: 0 }, // 9.8mm segment
        ],
      };

      const issues = checkMinFeatureSize(entity, 0, 0.5);

      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("segment 1");
    });

    it("passes polylines with all segments above minimum", () => {
      const entity: DxfEntity = {
        type: "POLYLINE",
        vertices: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
        ],
      };

      const issues = checkMinFeatureSize(entity, 0, 0.5);

      expect(issues).toHaveLength(0);
    });
  });
});

describe("checkSharpCorners", () => {
  it("flags acute angle corners", () => {
    // Create a V-shape with a sharp 60-degree internal angle at the corner
    // The path goes: up-left → corner → up-right, creating a sharp point
    const entity: DxfEntity = {
      type: "LWPOLYLINE",
      vertices: [
        { x: 0, y: 10 },    // p1 - top left
        { x: 5, y: 0 },     // p2 - sharp corner at bottom (vertex)
        { x: 10, y: 10 },   // p3 - top right
      ],
    };

    const issues = checkSharpCorners(entity, 0, 90);

    // The angle at p2 should be approximately 53 degrees (acute)
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].type).toBe("sharp_corner");
    expect(issues[0].severity).toBe("warning");
    expect(issues[0].value).toBeLessThan(90);
  });

  it("passes right angle corners (90 degrees)", () => {
    const entity: DxfEntity = {
      type: "LWPOLYLINE",
      vertices: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 }, // 90-degree turn
      ],
    };

    const issues = checkSharpCorners(entity, 0, 90);

    expect(issues).toHaveLength(0);
  });

  it("passes obtuse angle corners", () => {
    const entity: DxfEntity = {
      type: "LWPOLYLINE",
      vertices: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 5 }, // Obtuse angle
      ],
    };

    const issues = checkSharpCorners(entity, 0, 90);

    expect(issues).toHaveLength(0);
  });

  it("checks closing corner of closed polyline", () => {
    // Closed polygon with sharp corner at close point
    const entity: DxfEntity = {
      type: "LWPOLYLINE",
      vertices: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 5, y: 5 }, // Sharp corner at close
        { x: 0, y: 0 }, // Closes back to start
      ],
    };

    const issues = checkSharpCorners(entity, 0, 90);

    // Should detect sharp corners
    expect(issues.length).toBeGreaterThan(0);
  });

  it("ignores non-polyline entities", () => {
    const entity: DxfEntity = {
      type: "CIRCLE",
      center: { x: 50, y: 50 },
      radius: 10,
    };

    const issues = checkSharpCorners(entity, 0, 90);

    expect(issues).toHaveLength(0);
  });

  it("ignores polylines with fewer than 3 vertices", () => {
    const entity: DxfEntity = {
      type: "LWPOLYLINE",
      vertices: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
    };

    const issues = checkSharpCorners(entity, 0, 90);

    expect(issues).toHaveLength(0);
  });
});

describe("checkOpenContours", () => {
  it("flags open polylines", () => {
    const entity: DxfEntity = {
      type: "LWPOLYLINE",
      vertices: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        // Not closed - doesn't return to (0,0)
      ],
    };

    const issues = checkOpenContours(entity, 0);

    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("open_contour");
    expect(issues[0].severity).toBe("warning");
  });

  it("passes closed polylines", () => {
    const entity: DxfEntity = {
      type: "LWPOLYLINE",
      vertices: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
        { x: 0, y: 0 }, // Closed
      ],
    };

    const issues = checkOpenContours(entity, 0);

    expect(issues).toHaveLength(0);
  });

  it("includes gap distance in message", () => {
    const entity: DxfEntity = {
      type: "POLYLINE",
      vertices: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 5, y: 5 }, // 5√2 ≈ 7.07mm gap
      ],
    };

    const issues = checkOpenContours(entity, 0);

    expect(issues[0].value).toBeCloseTo(7.07, 1);
    expect(issues[0].message).toContain("gap");
  });

  it("handles near-closed polylines within tolerance", () => {
    const entity: DxfEntity = {
      type: "LWPOLYLINE",
      vertices: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
        { x: 0.0005, y: 0.0005 }, // Within 1 micron tolerance
      ],
    };

    const issues = checkOpenContours(entity, 0);

    expect(issues).toHaveLength(0);
  });
});

describe("checkAspectRatio", () => {
  it("flags high aspect ratio parts", () => {
    const parsed = createParsedDxf([], 500, 20); // 25:1 aspect ratio

    const issues = checkAspectRatio(parsed, 10);

    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("high_aspect_ratio");
    expect(issues[0].value).toBeCloseTo(25);
  });

  it("passes normal aspect ratio parts", () => {
    const parsed = createParsedDxf([], 100, 50); // 2:1 aspect ratio

    const issues = checkAspectRatio(parsed, 10);

    expect(issues).toHaveLength(0);
  });

  it("handles tall parts (inverted ratio)", () => {
    const parsed = createParsedDxf([], 20, 300); // 15:1 aspect ratio (tall)

    const issues = checkAspectRatio(parsed, 10);

    expect(issues).toHaveLength(1);
    expect(issues[0].value).toBeCloseTo(15);
  });

  it("handles zero dimensions gracefully", () => {
    const parsed = createParsedDxf([], 0, 100);

    const issues = checkAspectRatio(parsed, 10);

    expect(issues).toHaveLength(0);
  });
});

describe("checkDfm (integration)", () => {
  it("runs all checks and aggregates issues", () => {
    const parsed = createParsedDxf(
      [
        // Small hole (error)
        { type: "CIRCLE", center: { x: 10, y: 10 }, radius: 0.5 }, // 1mm diameter

        // Open polyline with sharp corner
        {
          type: "LWPOLYLINE",
          vertices: [
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 2 }, // Very sharp turn
          ],
        },
      ],
      500, // High aspect ratio
      20
    );

    const issues = checkDfm(parsed, { thickness: 2 });

    // Should have: hole_too_small, sharp_corner, open_contour, high_aspect_ratio
    expect(issues.length).toBeGreaterThanOrEqual(3);

    const types = issues.map((i) => i.type);
    expect(types).toContain("hole_too_small");
    expect(types).toContain("open_contour");
    expect(types).toContain("high_aspect_ratio");
  });

  it("respects custom options", () => {
    const parsed = createParsedDxf(
      [
        { type: "CIRCLE", center: { x: 10, y: 10 }, radius: 0.3 }, // 0.6mm diameter
      ],
      100,
      100
    );

    const strictIssues = checkDfm(parsed, {
      thickness: 1,
      minFeatureSize: 1, // Stricter
    });

    const lenientIssues = checkDfm(parsed, {
      thickness: 0.5, // More lenient
      minFeatureSize: 0.3,
    });

    expect(strictIssues.length).toBeGreaterThan(lenientIssues.length);
  });

  it("uses default values when options not provided", () => {
    const parsed = createParsedDxf(
      [
        { type: "CIRCLE", center: { x: 10, y: 10 }, radius: 0.2 }, // 0.4mm < 0.5mm default
      ],
      100,
      100
    );

    const issues = checkDfm(parsed, { thickness: 0.3 }); // Only required option

    // Should still check minFeatureSize with default 0.5mm
    const featureIssues = issues.filter((i) => i.type === "feature_too_small");
    expect(featureIssues.length).toBeGreaterThan(0);
  });
});

describe("getDfmSummary", () => {
  it("counts errors and warnings", () => {
    const issues: DfmIssue[] = [
      { type: "hole_too_small", severity: "error", message: "Error 1" },
      { type: "hole_too_small", severity: "error", message: "Error 2" },
      { type: "sharp_corner", severity: "warning", message: "Warning 1" },
    ];

    const summary = getDfmSummary(issues);

    expect(summary.errors).toBe(2);
    expect(summary.warnings).toBe(1);
    expect(summary.passed).toBe(false);
  });

  it("returns passed=true when no errors", () => {
    const issues: DfmIssue[] = [
      { type: "sharp_corner", severity: "warning", message: "Warning 1" },
      { type: "open_contour", severity: "warning", message: "Warning 2" },
    ];

    const summary = getDfmSummary(issues);

    expect(summary.errors).toBe(0);
    expect(summary.warnings).toBe(2);
    expect(summary.passed).toBe(true);
  });

  it("handles empty issues array", () => {
    const summary = getDfmSummary([]);

    expect(summary.errors).toBe(0);
    expect(summary.warnings).toBe(0);
    expect(summary.passed).toBe(true);
  });
});
