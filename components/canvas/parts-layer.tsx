"use client";

import { Layer } from "react-konva";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { CanvasPartComponent } from "./canvas-part";

const PART_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
];

interface PartsLayerProps {
  sheetWidth: number;
  sheetHeight: number;
}

export function PartsLayer({ sheetWidth, sheetHeight }: PartsLayerProps) {
  const parts = useCanvasStore((state) => state.parts);

  // Create color map by unique partId
  const partIds = [...new Set(parts.map((p) => p.partId))];
  const colorMap: Record<string, string> = {};
  partIds.forEach((id, index) => {
    colorMap[id] = PART_COLORS[index % PART_COLORS.length];
  });

  return (
    <Layer>
      {parts.map((part) => (
        <CanvasPartComponent
          key={part.id}
          part={part}
          color={colorMap[part.partId]}
          sheetWidth={sheetWidth}
          sheetHeight={sheetHeight}
        />
      ))}
    </Layer>
  );
}
