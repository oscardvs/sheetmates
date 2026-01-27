"use client";

import { useState, useRef, useCallback } from "react";
import type { NestingPlacement } from "@/lib/nesting/types";

interface SheetViewerProps {
  sheetWidth: number;
  sheetHeight: number;
  placements: NestingPlacement[];
  partSvgPaths?: Record<string, string>;
}

const COLORS = [
  "oklch(0.7 0.15 230)",
  "oklch(0.7 0.15 150)",
  "oklch(0.7 0.15 30)",
  "oklch(0.7 0.15 300)",
  "oklch(0.7 0.15 80)",
  "oklch(0.7 0.15 190)",
];

export function SheetViewer({
  sheetWidth,
  sheetHeight,
  placements,
  partSvgPaths = {},
}: SheetViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewBox, setViewBox] = useState({
    x: -10,
    y: -10,
    w: sheetWidth + 20,
    h: sheetHeight + 20,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((vb) => {
        const cx = vb.x + vb.w / 2;
        const cy = vb.y + vb.h / 2;
        const nw = vb.w * factor;
        const nh = vb.h * factor;
        return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
      });
    },
    []
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      const dx = (e.clientX - panStart.x) * scaleX;
      const dy = (e.clientY - panStart.y) * scaleY;
      setViewBox((vb) => ({ ...vb, x: vb.x - dx, y: vb.y - dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    [isPanning, panStart, viewBox]
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const partIds = [...new Set(placements.map((p) => p.partId))];
  const colorMap: Record<string, string> = {};
  partIds.forEach((id, i) => {
    colorMap[id] = COLORS[i % COLORS.length];
  });

  return (
    <svg
      ref={svgRef}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      className="w-full rounded-lg border bg-background"
      style={{ aspectRatio: `${sheetWidth} / ${sheetHeight}` }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Sheet outline */}
      <rect
        x={0}
        y={0}
        width={sheetWidth}
        height={sheetHeight}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="4 2"
      />

      {/* Placed parts */}
      {placements.map((p, i) => (
        <g
          key={i}
          transform={`translate(${p.x}, ${p.y})`}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="cursor-pointer"
        >
          {partSvgPaths[p.partId] ? (
            <g
              transform={
                p.rotation === 90
                  ? `rotate(90, ${p.width / 2}, ${p.height / 2})`
                  : undefined
              }
            >
              <path
                d={partSvgPaths[p.partId]}
                fill={colorMap[p.partId]}
                fillOpacity={hoveredIndex === i ? 0.5 : 0.3}
                stroke={colorMap[p.partId]}
                strokeWidth={0.5}
              />
            </g>
          ) : (
            <rect
              width={p.width}
              height={p.height}
              fill={colorMap[p.partId]}
              fillOpacity={hoveredIndex === i ? 0.5 : 0.3}
              stroke={colorMap[p.partId]}
              strokeWidth={0.5}
            />
          )}

          {/* Tooltip */}
          {hoveredIndex === i && (
            <text
              x={p.width / 2}
              y={p.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.min(p.width, p.height) * 0.15}
              fill="currentColor"
            >
              {p.partId.slice(0, 6)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
