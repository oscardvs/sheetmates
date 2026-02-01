"use client";

import { Layer, Rect, Text } from "react-konva";

interface SheetLayerProps {
  width: number;
  height: number;
}

export function SheetLayer({ width, height }: SheetLayerProps) {
  return (
    <Layer listening={false}>
      {/* Sheet boundary */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#334155" // slate-700
        opacity={0.3}
        stroke="#64748b" // slate-500
        strokeWidth={2}
        dash={[10, 5]}
      />

      {/* Dimension labels */}
      <Text
        x={width / 2}
        y={-25}
        text={`${width} mm`}
        fontSize={14}
        fontFamily="JetBrains Mono, monospace"
        fill="#a1a1aa" // zinc-400
        align="center"
        offsetX={30}
      />
      <Text
        x={-45}
        y={height / 2}
        text={`${height} mm`}
        fontSize={14}
        fontFamily="JetBrains Mono, monospace"
        fill="#a1a1aa"
        rotation={-90}
        offsetY={7}
      />

      {/* Origin marker */}
      <Text
        x={5}
        y={5}
        text="(0,0)"
        fontSize={10}
        fontFamily="JetBrains Mono, monospace"
        fill="#71717a" // zinc-500
      />
    </Layer>
  );
}
