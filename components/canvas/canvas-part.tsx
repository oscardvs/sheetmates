"use client";

import { useRef, useCallback } from "react";
import { Group, Rect, Path, Text } from "react-konva";
import type Konva from "konva";
import { useCanvasStore, type CanvasPart } from "@/lib/stores/canvas-store";

interface CanvasPartProps {
  part: CanvasPart;
  color: string;
  sheetWidth: number;
  sheetHeight: number;
}

export function CanvasPartComponent({
  part,
  color,
  sheetWidth,
  sheetHeight,
}: CanvasPartProps) {
  const groupRef = useRef<Konva.Group>(null);
  const { updatePart, selectPart, snapToGrid, gridSize } = useCanvasStore();

  const snapToGridValue = useCallback(
    (value: number): number => {
      if (!snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  const handleDragStart = useCallback(() => {
    updatePart(part.id, { isDragging: true });
    selectPart(part.id);
  }, [part.id, updatePart, selectPart]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const x = snapToGridValue(node.x());
      const y = snapToGridValue(node.y());

      // Account for rotation when calculating effective dimensions
      const isRotated90or270 = part.rotation === 90 || part.rotation === 270;
      const effectiveWidth = isRotated90or270 ? part.height : part.width;
      const effectiveHeight = isRotated90or270 ? part.width : part.height;

      // Clamp to sheet boundaries using effective dimensions
      const clampedX = Math.max(0, Math.min(x, sheetWidth - effectiveWidth));
      const clampedY = Math.max(0, Math.min(y, sheetHeight - effectiveHeight));

      updatePart(part.id, {
        x: clampedX,
        y: clampedY,
        isDragging: false,
      });

      // Snap position visually
      node.position({ x: clampedX, y: clampedY });
    },
    [part.id, part.width, part.height, part.rotation, sheetWidth, sheetHeight, updatePart, snapToGridValue]
  );

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      selectPart(part.id, e.evt.shiftKey);
    },
    [part.id, selectPart]
  );

  const handleTap = useCallback(() => {
    selectPart(part.id);
  }, [part.id, selectPart]);

  const fillOpacity = part.isSelected ? 0.6 : part.isDragging ? 0.5 : 0.3;
  const strokeWidth = part.isSelected ? 2 : 1;

  return (
    <Group
      ref={groupRef}
      x={part.x}
      y={part.y}
      rotation={part.rotation}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleTap}
    >
      {part.svgPath ? (
        <Path
          data={part.svgPath}
          fill={color}
          opacity={fillOpacity}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      ) : (
        <Rect
          width={part.width}
          height={part.height}
          fill={color}
          opacity={fillOpacity}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      )}

      {/* Part ID label (shown on select) */}
      {part.isSelected && (
        <Text
          x={part.width / 2}
          y={part.height / 2}
          text={part.partId.slice(0, 8)}
          fontSize={Math.min(part.width, part.height) * 0.12}
          fontFamily="JetBrains Mono, monospace"
          fill="#ffffff"
          align="center"
          verticalAlign="middle"
          offsetX={part.width * 0.15}
          offsetY={part.height * 0.06}
        />
      )}
    </Group>
  );
}
