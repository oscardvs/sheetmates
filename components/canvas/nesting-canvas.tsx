"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { Stage } from "react-konva";
import type Konva from "konva";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { GridLayer } from "./grid-layer";
import { SheetLayer } from "./sheet-layer";
import { PartsLayer } from "./parts-layer";

interface NestingCanvasProps {
  className?: string;
}

const PADDING = 50;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

export function NestingCanvas({ className }: NestingCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const {
    sheetWidth,
    sheetHeight,
    viewport,
    setViewport,
    isPanning,
    setPanning,
    deselectAll,
  } = useCanvasStore();

  // Track container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate initial scale to fit sheet in viewport
  const calculateFitScale = useCallback(() => {
    const scaleX = (dimensions.width - PADDING * 2) / sheetWidth;
    const scaleY = (dimensions.height - PADDING * 2) / sheetHeight;
    return Math.min(scaleX, scaleY, 1);
  }, [dimensions, sheetWidth, sheetHeight]);

  // Initialize viewport on mount
  useEffect(() => {
    const scale = calculateFitScale();
    setViewport({
      x: PADDING,
      y: PADDING,
      scale,
    });
  }, [calculateFitScale, setViewport]);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = viewport.scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - viewport.x) / oldScale,
        y: (pointer.y - viewport.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 1.1;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, direction > 0 ? oldScale * factor : oldScale / factor)
      );

      setViewport({
        scale: newScale,
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [viewport, setViewport]
  );

  // Handle pan (middle mouse)
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 1) {
        setPanning(true);
      }
    },
    [setPanning]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanning) return;
      setViewport({
        x: viewport.x + e.evt.movementX,
        y: viewport.y + e.evt.movementY,
      });
    },
    [isPanning, viewport, setViewport]
  );

  const handleMouseUp = useCallback(() => {
    setPanning(false);
  }, [setPanning]);

  // Click on empty space to deselect
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        deselectAll();
      }
    },
    [deselectAll]
  );

  return (
    <div
      ref={containerRef}
      className={`bg-zinc-950 overflow-hidden ${className ?? ""}`}
      style={{ cursor: isPanning ? "grabbing" : "default" }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleStageClick}
      >
        <GridLayer width={sheetWidth} height={sheetHeight} />
        <SheetLayer width={sheetWidth} height={sheetHeight} />
        <PartsLayer sheetWidth={sheetWidth} sheetHeight={sheetHeight} />
      </Stage>
    </div>
  );
}
