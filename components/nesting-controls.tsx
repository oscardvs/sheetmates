"use client";

import { useTranslations } from "next-intl";
import type { NestingProgress } from "@/lib/nesting";
import { SpinnerIcon, XIcon, CpuIcon, PackageIcon, PlayIcon } from "@phosphor-icons/react";

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
    <div className="space-y-6">
      <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-white">
        {t("title")}
      </h3>

      {/* Material Select */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-zinc-400">
          {t("selectMaterial")}
        </label>
        <select
          value={material}
          onChange={(e) => onMaterialChange(e.target.value)}
          className="w-full border border-zinc-700 bg-zinc-800/50 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="steel">Steel</option>
          <option value="stainless">Stainless Steel</option>
          <option value="aluminum">Aluminum</option>
          <option value="copper">Copper</option>
        </select>
      </div>

      {/* Sheet Dimensions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="font-mono text-xs uppercase tracking-wider text-zinc-400">
            {t("sheetWidth")}
          </label>
          <input
            type="number"
            value={sheetWidth}
            onChange={(e) => onSheetWidthChange(Number(e.target.value))}
            disabled={loading}
            className="w-full border border-zinc-700 bg-zinc-800/50 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <label className="font-mono text-xs uppercase tracking-wider text-zinc-400">
            {t("sheetHeight")}
          </label>
          <input
            type="number"
            value={sheetHeight}
            onChange={(e) => onSheetHeightChange(Number(e.target.value))}
            disabled={loading}
            className="w-full border border-zinc-700 bg-zinc-800/50 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Kerf */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-zinc-400">
          {t("kerf")} (mm)
        </label>
        <input
          type="number"
          step="0.1"
          value={kerf}
          onChange={(e) => onKerfChange(Number(e.target.value))}
          disabled={loading}
          className="w-full border border-zinc-700 bg-zinc-800/50 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Nesting Progress Panel */}
      {isNesting ? (
        <div className="space-y-3 border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-sm text-emerald-400">
              <SpinnerIcon className="h-4 w-4 animate-spin" />
              <span>{t("optimizing")}</span>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex h-6 w-6 items-center justify-center text-zinc-400 transition-colors hover:text-white"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="h-1.5 bg-zinc-800">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs text-zinc-400">
            <div>
              <span>{t("generation")}: </span>
              <span className="text-white">
                {progress.iteration}/{progress.totalIterations}
              </span>
            </div>
            <div className="text-right">
              <span>{t("currentUtilization")}: </span>
              <span className="text-emerald-400">
                {(progress.utilization * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onRunNesting}
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 bg-emerald-500 px-4 py-3 font-mono text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
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
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
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
      <div className="space-y-3 border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase text-zinc-500">{t("utilization")}</span>
          <span className="font-mono text-lg font-bold text-emerald-400">
            {(utilization * 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 bg-zinc-800">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${utilization * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase text-zinc-500">{t("partsPlaced")}</span>
          <span className="font-mono text-lg font-bold text-white">{partsPlaced}</span>
        </div>
      </div>
    </div>
  );
}
