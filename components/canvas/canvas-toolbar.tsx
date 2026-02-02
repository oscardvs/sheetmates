"use client";

import { useTranslations } from "next-intl";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MagnetStraight,
  ArrowsOut,
  Trash,
  ArrowClockwise,
  GridFour,
} from "@phosphor-icons/react";
import { calculateUtilization } from "@/lib/canvas/collision";

interface CanvasToolbarProps {
  onRunNesting?: () => void;
  nestingLoading?: boolean;
}

export function CanvasToolbar({
  onRunNesting,
  nestingLoading,
}: CanvasToolbarProps) {
  const t = useTranslations("canvas");
  const {
    parts,
    sheetWidth,
    sheetHeight,
    snapToGrid,
    toggleSnapToGrid,
    clearParts,
    resetViewport,
    selectedPartIds,
    removePart,
    updatePart,
  } = useCanvasStore();

  const utilization = calculateUtilization(parts, sheetWidth, sheetHeight);
  const selectedId = [...selectedPartIds][0];

  const handleRotateSelected = () => {
    if (!selectedId) return;
    const part = parts.find((p) => p.id === selectedId);
    if (!part) return;
    const newRotation = ((part.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    updatePart(selectedId, { rotation: newRotation });
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    removePart(selectedId);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-2">
      {/* Snap toggle */}
      <Button
        variant={snapToGrid ? "default" : "ghost"}
        size="icon-sm"
        onClick={toggleSnapToGrid}
        title={t("snapToGrid")}
      >
        <MagnetStraight className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Selection actions */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleRotateSelected}
        disabled={!selectedId}
        title={t("rotate90")}
      >
        <ArrowClockwise className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleDeleteSelected}
        disabled={!selectedId}
        title={t("deleteSelected")}
      >
        <Trash className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* View actions */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={resetViewport}
        title={t("resetView")}
      >
        <ArrowsOut className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={clearParts}
        disabled={parts.length === 0}
        title={t("clearAll")}
      >
        <Trash className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Auto-nest */}
      <Button
        variant="default"
        size="sm"
        onClick={onRunNesting}
        disabled={nestingLoading || parts.length === 0}
      >
        <GridFour className="mr-1.5 h-4 w-4" />
        {t("autoNest")}
      </Button>

      {/* Stats */}
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline">
          {parts.length} {t("parts")}
        </Badge>
        <Badge
          variant={utilization > 0.7 ? "default" : "secondary"}
          className="font-mono"
        >
          {(utilization * 100).toFixed(1)}%
        </Badge>
      </div>
    </div>
  );
}
