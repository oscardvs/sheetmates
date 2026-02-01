"use client";

import { Layer, Line } from "react-konva";
import { useMemo, type ReactElement } from "react";

interface GridLayerProps {
  width: number;
  height: number;
  gridSize?: number;
  majorGridSize?: number;
}

export function GridLayer({
  width,
  height,
  gridSize = 10,
  majorGridSize = 100,
}: GridLayerProps) {
  const lines = useMemo(() => {
    const result: ReactElement[] = [];

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      const isMajor = x % majorGridSize === 0;
      result.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke={isMajor ? "#3f3f46" : "#27272a"} // zinc-700 : zinc-800
          strokeWidth={isMajor ? 1 : 0.5}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      const isMajor = y % majorGridSize === 0;
      result.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke={isMajor ? "#3f3f46" : "#27272a"}
          strokeWidth={isMajor ? 1 : 0.5}
          listening={false}
        />
      );
    }

    return result;
  }, [width, height, gridSize, majorGridSize]);

  return <Layer listening={false}>{lines}</Layer>;
}
