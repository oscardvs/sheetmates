"use client";

interface DxfPreviewProps {
  svgPath: string;
  width: number;
  height: number;
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
  className?: string;
}

export function DxfPreview({
  svgPath,
  width,
  height,
  boundingBox,
  className = "",
}: DxfPreviewProps) {
  const padding = Math.max(width, height) * 0.05;
  const vbX = boundingBox.minX - padding;
  const vbY = 0 - padding;
  const vbW = width + padding * 2;
  const vbH = height + padding * 2;

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      className={`border rounded bg-background ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d={svgPath}
        fill="none"
        stroke="currentColor"
        strokeWidth={Math.max(width, height) * 0.005}
      />
    </svg>
  );
}
