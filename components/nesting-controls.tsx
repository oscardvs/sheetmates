"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NestingProgress } from "@/lib/nesting";
import { Loader2, X, Cpu, Package } from "lucide-react";

interface NestingControlsProps {
  sheetWidth: number;
  sheetHeight: number;
  material: string;
  kerf: number;
  utilization: number;
  partsPlaced: number;
  onSheetWidthChange: (v: number) => void;
  onSheetHeightChange: (v: number) => void;
  onMaterialChange: (v: string) => void;
  onKerfChange: (v: number) => void;
  onRunNesting: () => void;
  loading?: boolean;
  /** Progress state from useWasmNesting */
  progress?: NestingProgress | null;
  /** Whether WASM algorithm is available */
  wasmAvailable?: boolean;
  /** Cancel the current nesting operation */
  onCancel?: () => void;
}

export function NestingControls({
  sheetWidth,
  sheetHeight,
  material,
  kerf,
  utilization,
  partsPlaced,
  onSheetWidthChange,
  onSheetHeightChange,
  onMaterialChange,
  onKerfChange,
  onRunNesting,
  loading,
  progress,
  wasmAvailable,
  onCancel,
}: NestingControlsProps) {
  const t = useTranslations("nesting");

  const isNesting = loading && progress;
  const progressPercent = progress
    ? (progress.iteration / progress.totalIterations) * 100
    : 0;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{t("title")}</h3>

      <div className="space-y-2">
        <Label>{t("selectMaterial")}</Label>
        <Select value={material} onValueChange={onMaterialChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="steel">Steel</SelectItem>
            <SelectItem value="stainless">Stainless Steel</SelectItem>
            <SelectItem value="aluminum">Aluminum</SelectItem>
            <SelectItem value="copper">Copper</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>{t("sheetWidth")}</Label>
          <Input
            type="number"
            value={sheetWidth}
            onChange={(e) => onSheetWidthChange(Number(e.target.value))}
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <Label>{t("sheetHeight")}</Label>
          <Input
            type="number"
            value={sheetHeight}
            onChange={(e) => onSheetHeightChange(Number(e.target.value))}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>{t("kerf")}</Label>
        <Input
          type="number"
          step="0.1"
          value={kerf}
          onChange={(e) => onKerfChange(Number(e.target.value))}
          disabled={loading}
        />
      </div>

      {/* Nesting Progress Panel */}
      {isNesting ? (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("optimizing")}</span>
            </div>
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">{t("cancel")}</span>
              </Button>
            )}
          </div>

          <Progress value={progressPercent} className="h-2" />

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span>{t("generation")}: </span>
              <span className="font-mono font-medium text-foreground">
                {progress.iteration}/{progress.totalIterations}
              </span>
            </div>
            <div className="text-right">
              <span>{t("currentUtilization")}: </span>
              <span className="font-mono font-medium text-foreground">
                {(progress.utilization * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={onRunNesting} className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {t("runNesting")}
        </Button>
      )}

      {/* Algorithm Badge */}
      {wasmAvailable !== undefined && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {wasmAvailable ? (
            <>
              <Cpu className="h-3 w-3" />
              <span>{t("wasmAlgorithm")}</span>
            </>
          ) : (
            <>
              <Package className="h-3 w-3" />
              <span>{t("fallbackAlgorithm")}</span>
            </>
          )}
        </div>
      )}

      <div className="space-y-1 rounded-lg border p-3 text-sm">
        <p>
          {t("utilization")}: <strong>{(utilization * 100).toFixed(1)}%</strong>
        </p>
        <p>
          {t("partsPlaced")}: <strong>{partsPlaced}</strong>
        </p>
      </div>
    </div>
  );
}
