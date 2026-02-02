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
      className={`bg-zinc-950 ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d={svgPath}
        fill="none"
        stroke="#10b981"
        strokeWidth={Math.max(width, height) * 0.008}
      />
    </svg>
  );
}
