/**
 * DFM (Design for Manufacturability) Checks Module
 *
 * Validates DXF designs against Trumpf laser cutting constraints:
 * - Minimum hole diameter ≥ material thickness
 * - Minimum feature size ≥ 0.5mm for sheet metal
 * - Sharp internal corners (< 90°) need relief cuts
 * - Aspect ratio limits to prevent heat warping
 */

import type { ParsedDxf, DxfEntity } from "./parser";

export type DfmIssueSeverity = "error" | "warning";

export type DfmIssueType =
  | "hole_too_small"
  | "feature_too_small"
  | "sharp_corner"
  | "high_aspect_ratio"
  | "open_contour";

export interface DfmIssue {
  type: DfmIssueType;
  severity: DfmIssueSeverity;
  message: string;
  location?: { x: number; y: number };
  entityIndex?: number;
  value?: number;
  limit?: number;
}

export interface DfmCheckOptions {
  /** Material thickness in mm */
  thickness: number;
  /** Minimum feature size in mm (default: 0.5) */
  minFeatureSize?: number;
  /** Minimum internal angle in degrees before warning (default: 90) */
  minCornerAngle?: number;
  /** Maximum aspect ratio before warning (default: 10) */
  maxAspectRatio?: number;
}

const DEFAULT_MIN_FEATURE_SIZE = 0.5;
const DEFAULT_MIN_CORNER_ANGLE = 90;
const DEFAULT_MAX_ASPECT_RATIO = 10;

/**
 * Run all DFM checks on a parsed DXF
 */
export function checkDfm(
  parsed: ParsedDxf,
  options: DfmCheckOptions
): DfmIssue[] {
  const issues: DfmIssue[] = [];
  const minFeatureSize = options.minFeatureSize ?? DEFAULT_MIN_FEATURE_SIZE;
  const minCornerAngle = options.minCornerAngle ?? DEFAULT_MIN_CORNER_ANGLE;
  const maxAspectRatio = options.maxAspectRatio ?? DEFAULT_MAX_ASPECT_RATIO;

  // Check each entity
  parsed.entities.forEach((entity, index) => {
    // Check hole diameters (circles)
    const holeIssues = checkHoleDiameter(entity, index, options.thickness);
    issues.push(...holeIssues);

    // Check for small features
    const featureIssues = checkMinFeatureSize(entity, index, minFeatureSize);
    issues.push(...featureIssues);

    // Check for sharp corners in polylines
    const cornerIssues = checkSharpCorners(entity, index, minCornerAngle);
    issues.push(...cornerIssues);

    // Check for open contours (unclosed polylines)
    const contourIssues = checkOpenContours(entity, index);
    issues.push(...contourIssues);
  });

  // Check overall aspect ratio
  const aspectIssues = checkAspectRatio(parsed, maxAspectRatio);
  issues.push(...aspectIssues);

  return issues;
}

/**
 * Check if circle (hole) diameter is at least material thickness
 * Trumpf laser rule: hole diameter ≥ material thickness
 */
export function checkHoleDiameter(
  entity: DxfEntity,
  entityIndex: number,
  thickness: number
): DfmIssue[] {
  if (entity.type !== "CIRCLE" || entity.radius == null) {
    return [];
  }

  const diameter = entity.radius * 2;
  if (diameter < thickness) {
    return [
      {
        type: "hole_too_small",
        severity: "error",
        message: `Hole diameter (${diameter.toFixed(2)}mm) is less than material thickness (${thickness}mm)`,
        location: entity.center,
        entityIndex,
        value: diameter,
        limit: thickness,
      },
    ];
  }

  return [];
}

/**
 * Check for features smaller than minimum size
 */
export function checkMinFeatureSize(
  entity: DxfEntity,
  entityIndex: number,
  minSize: number
): DfmIssue[] {
  const issues: DfmIssue[] = [];

  // Check circle radius
  if (entity.type === "CIRCLE" && entity.radius != null) {
    if (entity.radius * 2 < minSize) {
      issues.push({
        type: "feature_too_small",
        severity: "warning",
        message: `Circle diameter (${(entity.radius * 2).toFixed(2)}mm) is below minimum feature size (${minSize}mm)`,
        location: entity.center,
        entityIndex,
        value: entity.radius * 2,
        limit: minSize,
      });
    }
  }

  // Check line length
  if (entity.type === "LINE" && entity.startPoint && entity.endPoint) {
    const length = Math.sqrt(
      Math.pow(entity.endPoint.x - entity.startPoint.x, 2) +
        Math.pow(entity.endPoint.y - entity.startPoint.y, 2)
    );
    if (length < minSize) {
      issues.push({
        type: "feature_too_small",
        severity: "warning",
        message: `Line length (${length.toFixed(2)}mm) is below minimum feature size (${minSize}mm)`,
        location: entity.startPoint,
        entityIndex,
        value: length,
        limit: minSize,
      });
    }
  }

  // Check polyline segment lengths
  if (
    (entity.type === "LWPOLYLINE" || entity.type === "POLYLINE") &&
    entity.vertices &&
    entity.vertices.length >= 2
  ) {
    for (let i = 0; i < entity.vertices.length - 1; i++) {
      const v1 = entity.vertices[i];
      const v2 = entity.vertices[i + 1];
      const segmentLength = Math.sqrt(
        Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2)
      );
      if (segmentLength < minSize && segmentLength > 0) {
        issues.push({
          type: "feature_too_small",
          severity: "warning",
          message: `Polyline segment ${i + 1} length (${segmentLength.toFixed(2)}mm) is below minimum feature size (${minSize}mm)`,
          location: v1,
          entityIndex,
          value: segmentLength,
          limit: minSize,
        });
      }
    }
  }

  return issues;
}

/**
 * Check for sharp internal corners in polylines
 * Internal corners < 90° typically need relief cuts (dog-bone)
 */
export function checkSharpCorners(
  entity: DxfEntity,
  entityIndex: number,
  minAngle: number
): DfmIssue[] {
  if (
    (entity.type !== "LWPOLYLINE" && entity.type !== "POLYLINE") ||
    !entity.vertices ||
    entity.vertices.length < 3
  ) {
    return [];
  }

  const issues: DfmIssue[] = [];
  const vertices = entity.vertices;

  // Check each triplet of consecutive vertices
  for (let i = 0; i < vertices.length - 2; i++) {
    const p1 = vertices[i];
    const p2 = vertices[i + 1];
    const p3 = vertices[i + 2];

    const angle = calculateAngle(p1, p2, p3);

    // Internal corner check: angle less than threshold
    if (angle < minAngle) {
      issues.push({
        type: "sharp_corner",
        severity: "warning",
        message: `Sharp internal corner (${angle.toFixed(1)}°) at vertex ${i + 2}. Consider adding relief cut.`,
        location: p2,
        entityIndex,
        value: angle,
        limit: minAngle,
      });
    }
  }

  // Check closing angle if polyline is closed
  if (isPolylineClosed(vertices) && vertices.length >= 4) {
    const n = vertices.length;
    // Second-to-last to first (skipping the duplicate closing vertex)
    const p1 = vertices[n - 3];
    const p2 = vertices[n - 2];
    const p3 = vertices[1];

    const angle = calculateAngle(p1, p2, p3);
    if (angle < minAngle) {
      issues.push({
        type: "sharp_corner",
        severity: "warning",
        message: `Sharp internal corner (${angle.toFixed(1)}°) at closing vertex. Consider adding relief cut.`,
        location: p2,
        entityIndex,
        value: angle,
        limit: minAngle,
      });
    }
  }

  return issues;
}

/**
 * Check for open contours (unclosed polylines)
 * Parts should be closed for proper cutting
 */
export function checkOpenContours(
  entity: DxfEntity,
  entityIndex: number
): DfmIssue[] {
  if (
    (entity.type !== "LWPOLYLINE" && entity.type !== "POLYLINE") ||
    !entity.vertices ||
    entity.vertices.length < 3
  ) {
    return [];
  }

  if (!isPolylineClosed(entity.vertices)) {
    const firstVertex = entity.vertices[0];
    const lastVertex = entity.vertices[entity.vertices.length - 1];
    const gap = Math.sqrt(
      Math.pow(lastVertex.x - firstVertex.x, 2) +
        Math.pow(lastVertex.y - firstVertex.y, 2)
    );

    return [
      {
        type: "open_contour",
        severity: "warning",
        message: `Polyline is not closed (gap: ${gap.toFixed(2)}mm). Part may not cut correctly.`,
        location: lastVertex,
        entityIndex,
        value: gap,
      },
    ];
  }

  return [];
}

/**
 * Check if overall aspect ratio is within limits
 * Very long/thin parts are prone to heat warping
 */
export function checkAspectRatio(
  parsed: ParsedDxf,
  maxRatio: number
): DfmIssue[] {
  if (parsed.width === 0 || parsed.height === 0) {
    return [];
  }

  const aspectRatio = Math.max(
    parsed.width / parsed.height,
    parsed.height / parsed.width
  );

  if (aspectRatio > maxRatio) {
    return [
      {
        type: "high_aspect_ratio",
        severity: "warning",
        message: `High aspect ratio (${aspectRatio.toFixed(1)}:1) may cause heat warping. Consider splitting part.`,
        value: aspectRatio,
        limit: maxRatio,
      },
    ];
  }

  return [];
}

/**
 * Calculate angle at vertex p2 formed by p1-p2-p3
 * Returns angle in degrees (0-180)
 */
function calculateAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number {
  // Vectors from p2 to p1 and p2 to p3
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  // Dot product
  const dot = v1.x * v2.x + v1.y * v2.y;

  // Magnitudes
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) {
    return 180; // Degenerate case
  }

  // Clamp to avoid floating point errors with acos
  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  const angleRad = Math.acos(cosAngle);

  return (angleRad * 180) / Math.PI;
}

/**
 * Check if a polyline is closed (first and last vertices coincide)
 */
function isPolylineClosed(vertices: { x: number; y: number }[]): boolean {
  if (vertices.length < 3) return false;

  const first = vertices[0];
  const last = vertices[vertices.length - 1];
  const tolerance = 0.001; // 1 micron tolerance

  return (
    Math.abs(first.x - last.x) < tolerance &&
    Math.abs(first.y - last.y) < tolerance
  );
}

/**
 * Get summary of DFM issues by severity
 */
export function getDfmSummary(issues: DfmIssue[]): {
  errors: number;
  warnings: number;
  passed: boolean;
} {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;

  return {
    errors,
    warnings,
    passed: errors === 0,
  };
}
