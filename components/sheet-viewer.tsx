"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { NestingPlacement } from "@/lib/nesting/types";

interface SheetViewerProps {
  sheetWidth: number;
  sheetHeight: number;
  placements: NestingPlacement[];
  partSvgPaths?: Record<string, string>;
}

// Emerald-based color palette for parts
const COLORS = [
  "#10b981", // emerald-500
  "#22d3ee", // cyan-400
  "#a78bfa", // violet-400
  "#fb923c", // orange-400
  "#f472b6", // pink-400
  "#facc15", // yellow-400
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

  // Attach wheel handler with passive: false to allow preventDefault
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((vb) => {
        const cx = vb.x + vb.w / 2;
        const cy = vb.y + vb.h / 2;
        const nw = vb.w * factor;
        const nh = vb.h * factor;
        return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
      });
    };

    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, []);

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

  // Grid settings
  const gridSmall = 10; // 10mm grid
  const gridLarge = 100; // 100mm grid

  return (
    <svg
      ref={svgRef}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      className="w-full bg-zinc-950"
      style={{ aspectRatio: `${sheetWidth} / ${sheetHeight}` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <defs>
        {/* Small grid pattern */}
        <pattern
          id="gridSmall"
          width={gridSmall}
          height={gridSmall}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSmall} 0 L 0 0 0 ${gridSmall}`}
            fill="none"
            stroke="#27272a"
            strokeWidth="0.5"
          />
        </pattern>
        {/* Large grid pattern */}
        <pattern
          id="gridLarge"
          width={gridLarge}
          height={gridLarge}
          patternUnits="userSpaceOnUse"
        >
          <rect width={gridLarge} height={gridLarge} fill="url(#gridSmall)" />
          <path
            d={`M ${gridLarge} 0 L 0 0 0 ${gridLarge}`}
            fill="none"
            stroke="#3f3f46"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      {/* Grid background */}
      <rect
        x={0}
        y={0}
        width={sheetWidth}
        height={sheetHeight}
        fill="url(#gridLarge)"
      />

      {/* Sheet outline */}
      <rect
        x={0}
        y={0}
        width={sheetWidth}
        height={sheetHeight}
        fill="none"
        stroke="#71717a"
        strokeWidth={2}
        strokeOpacity={0.5}
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
                fillOpacity={hoveredIndex === i ? 0.4 : 0.2}
                stroke={colorMap[p.partId]}
                strokeWidth={hoveredIndex === i ? 1 : 0.5}
              />
            </g>
          ) : (
            <rect
              width={p.width}
              height={p.height}
              fill={colorMap[p.partId]}
              fillOpacity={hoveredIndex === i ? 0.4 : 0.2}
              stroke={colorMap[p.partId]}
              strokeWidth={hoveredIndex === i ? 1 : 0.5}
            />
          )}

          {/* Tooltip */}
          {hoveredIndex === i && (
            <text
              x={p.width / 2}
              y={p.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.min(p.width, p.height) * 0.12}
              fill="#ffffff"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {p.partId.slice(0, 6)}
            </text>
          )}
        </g>
      ))}

      {/* Dimension labels */}
      <text
        x={sheetWidth / 2}
        y={-5}
        textAnchor="middle"
        fontSize={Math.min(sheetWidth, sheetHeight) * 0.015}
        fill="#71717a"
        fontFamily="monospace"
      >
        {sheetWidth} mm
      </text>
      <text
        x={-5}
        y={sheetHeight / 2}
        textAnchor="middle"
        fontSize={Math.min(sheetWidth, sheetHeight) * 0.015}
        fill="#71717a"
        fontFamily="monospace"
        transform={`rotate(-90, -5, ${sheetHeight / 2})`}
      >
        {sheetHeight} mm
      </text>
    </svg>
  );
}
