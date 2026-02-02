"use client";

import { useTranslations } from "next-intl";
import type { NestingProgress } from "@/lib/nesting";
import { SpinnerIcon, XIcon, CpuIcon, PackageIcon, PlayIcon } from "@phosphor-icons/react";

interface NestingControlsProps {
  sheetWidth: number;
  sheetHeight: number;
  material: string;
  thickness: number;
  kerf: number;
  utilization: number;
  partsPlaced: number;
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

// Material display labels
const MATERIAL_LABELS: Record<string, string> = {
  steel: "Steel",
  stainless: "Stainless Steel",
  aluminum: "Aluminum",
  copper: "Copper",
};

export function NestingControls({
  sheetWidth,
  sheetHeight,
  material,
  thickness,
  kerf,
  utilization,
  partsPlaced,
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
    <div className="space-y-6">
      <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
        {t("title")}
      </h3>

      {/* Sheet Info (read-only) */}
      <div className="space-y-2 border border-border bg-card/30 p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase text-muted-foreground">Sheet</span>
          <span className="font-mono text-sm text-foreground">
            {sheetWidth} × {sheetHeight} mm
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase text-muted-foreground">Material</span>
          <span className="font-mono text-sm text-foreground">
            {MATERIAL_LABELS[material] || material} {thickness}mm
          </span>
        </div>
      </div>

      {/* Kerf */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t("kerf")} (mm)
        </label>
        <input
          type="number"
          step="0.1"
          value={kerf}
          onChange={(e) => onKerfChange(Number(e.target.value))}
          disabled={loading}
          className="w-full border border-border bg-card/50 px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Nesting Progress Panel */}
      {isNesting ? (
        <div className="space-y-3 border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-sm text-primary">
              <SpinnerIcon className="h-4 w-4 animate-spin" />
              <span>{t("optimizing")}</span>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="h-1.5 bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs text-muted-foreground">
            <div>
              <span>{t("generation")}: </span>
              <span className="text-foreground">
                {progress.iteration}/{progress.totalIterations}
              </span>
            </div>
            <div className="text-right">
              <span>{t("currentUtilization")}: </span>
              <span className="text-primary">
                {(progress.utilization * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onRunNesting}
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <SpinnerIcon className="h-4 w-4 animate-spin" />
          ) : (
            <PlayIcon className="h-4 w-4" weight="fill" />
          )}
          {t("runNesting")}
        </button>
      )}

      {/* Algorithm Badge */}
      {wasmAvailable !== undefined && (
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          {wasmAvailable ? (
            <>
              <CpuIcon className="h-3 w-3" />
              <span>{t("wasmAlgorithm")}</span>
            </>
          ) : (
            <>
              <PackageIcon className="h-3 w-3" />
              <span>{t("fallbackAlgorithm")}</span>
            </>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="space-y-3 border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase text-muted-foreground">{t("utilization")}</span>
          <span className="font-mono text-lg font-bold text-primary">
            {(utilization * 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 bg-muted">
          <div
            className="h-full bg-primary"
            style={{ width: `${utilization * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase text-muted-foreground">{t("partsPlaced")}</span>
          <span className="font-mono text-lg font-bold text-foreground">{partsPlaced}</span>
        </div>
      </div>
    </div>
  );
}
