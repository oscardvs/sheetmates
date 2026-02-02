"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { parseDxfString, type ParsedDxf } from "@/lib/dxf/parser";
import { dxfToSvgPath } from "@/lib/dxf/to-svg";
import { computeArea } from "@/lib/dxf/compute-area";
import { computeCutLength } from "@/lib/dxf/compute-cut-length";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UploadIcon,
  ArrowRightIcon,
  XIcon,
  CrosshairIcon,
  RulerIcon,
  ScissorsIcon,
  CurrencyEurIcon,
} from "@phosphor-icons/react";

interface UploadedPart {
  id: string;
  fileName: string;
  parsed: ParsedDxf;
  svgPath: string;
  area: number;
  cutLength: number;
  color: string;
}

const PART_COLORS = [
  "var(--color-primary)",
  "rgb(59, 130, 246)", // blue-500
  "rgb(168, 85, 247)", // purple-500
  "rgb(249, 115, 22)", // orange-500
  "rgb(236, 72, 153)", // pink-500
  "rgb(20, 184, 166)", // teal-500
];

// Standard sheet: 3000x1500mm
const SHEET_WIDTH = 3000;
const SHEET_HEIGHT = 1500;

// Estimated pricing (simplified for demo)
const PRICE_PER_CM2 = 0.003; // €/cm²
const PRICE_PER_MM_CUT = 0.002; // €/mm

// Storage key for persisting parts across navigation
const STORAGE_KEY = "sheetmates_landing_parts";

export function LandingCanvas() {
  const t = useTranslations("landing.canvas");
  const tHero = useTranslations("landing.hero");
  const [parts, setParts] = useState<UploadedPart[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Save parts to sessionStorage when they change
  useEffect(() => {
    if (parts.length > 0) {
      const serializable = parts.map(p => ({
        id: p.id,
        fileName: p.fileName,
        parsed: p.parsed,
        svgPath: p.svgPath,
        area: p.area,
        cutLength: p.cutLength,
        color: p.color,
      }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [parts]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newParts: UploadedPart[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".dxf")) continue;
      try {
        const content = await file.text();
        const parsed = parseDxfString(content);
        const svgPath = dxfToSvgPath(parsed);
        const area = computeArea(parsed);
        const cutLength = computeCutLength(parsed);

        newParts.push({
          id: crypto.randomUUID(),
          fileName: file.name,
          parsed,
          svgPath,
          area,
          cutLength,
          color: PART_COLORS[(parts.length + newParts.length) % PART_COLORS.length],
        });
      } catch (err) {
        console.error(`Failed to parse ${file.name}:`, err);
      }
    }

    setParts((prev) => [...prev, ...newParts]);
    setIsProcessing(false);
  }, [parts.length]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const removePart = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
  };

  // Calculate totals
  const totals = useMemo(() => {
    const totalArea = parts.reduce((sum, p) => sum + p.area, 0);
    const totalCut = parts.reduce((sum, p) => sum + p.cutLength, 0);
    const sheetArea = SHEET_WIDTH * SHEET_HEIGHT;
    const utilization = totalArea / sheetArea;
    const estimatedPrice = (totalArea / 100) * PRICE_PER_CM2 + totalCut * PRICE_PER_MM_CUT;

    return {
      totalArea,
      totalCut,
      utilization,
      estimatedPrice,
      partCount: parts.length,
    };
  }, [parts]);

  // Simple shelf-pack placement for visualization
  const placements = useMemo(() => {
    const result: Array<{ part: UploadedPart; x: number; y: number }> = [];
    let currentX = 10;
    let currentY = 10;
    let rowHeight = 0;
    const gap = 10;

    for (const part of parts) {
      const w = part.parsed.width;
      const h = part.parsed.height;

      if (currentX + w > SHEET_WIDTH - 10) {
        currentX = 10;
        currentY += rowHeight + gap;
        rowHeight = 0;
      }

      if (currentY + h <= SHEET_HEIGHT - 10) {
        result.push({ part, x: currentX, y: currentY });
        currentX += w + gap;
        rowHeight = Math.max(rowHeight, h);
      }
    }

    return result;
  }, [parts]);

  return (
    <section className="relative bg-background">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-4 border-primary/50 bg-primary/10 font-mono text-primary"
          >
            {t("badge")}
          </Badge>
          <h1 className="mb-4 font-mono text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            <span className="text-muted-foreground">{t("heroDrop")} </span>
            <span className="text-primary">{t("heroDxf")}</span>
            <span className="text-muted-foreground"> {t("heroArrow")} </span>
            <span className="text-primary">{t("heroParts")}</span>
          </h1>
          <p className="mx-auto max-w-2xl font-mono text-sm text-muted-foreground md:text-base">
            {t("heroSubtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Drop Zone & Parts List */}
          <div className="flex flex-col gap-4">
            {/* Drop Zone - matches sheet preview height */}
            <div
              className={`relative flex min-h-[280px] flex-1 cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed p-8 transition-all lg:min-h-0 ${
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("landing-dxf-input")?.click()}
            >
              <UploadIcon className={`h-16 w-16 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-center">
                <p className="font-mono text-xl font-medium text-foreground">
                  {isProcessing ? t("processing") : t("dropZone")}
                </p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {t("dropHelper")}
                </p>
              </div>
              <input
                id="landing-dxf-input"
                type="file"
                accept=".dxf"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {/* Parts List */}
            {parts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">
                    {t("loadedParts")} ({parts.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setParts([])}
                  >
                    {t("clearAll")}
                  </Button>
                </div>

                <div className="max-h-[200px] space-y-1 overflow-y-auto">
                  {parts.map((part) => (
                    <div
                      key={part.id}
                      className="group flex items-center gap-3 bg-muted/50 px-3 py-2"
                    >
                      <div
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: part.color }}
                      />
                      <span className="flex-1 truncate font-mono text-xs text-foreground">
                        {part.fileName}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {part.parsed.width.toFixed(0)}×{part.parsed.height.toFixed(0)}
                      </span>
                      <button
                        onClick={() => removePart(part.id)}
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Panel */}
            {parts.length > 0 && (
              <div className="grid grid-cols-2 gap-2 border border-border bg-card/30 p-4">
                <div className="flex items-center gap-2">
                  <CrosshairIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{t("metricParts")}</p>
                    <p className="font-mono text-lg font-bold text-foreground">
                      {totals.partCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RulerIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{t("metricArea")}</p>
                    <p className="font-mono text-lg font-bold text-foreground">
                      {(totals.totalArea / 100).toFixed(0)} cm²
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ScissorsIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{t("metricCutLength")}</p>
                    <p className="font-mono text-lg font-bold text-foreground">
                      {(totals.totalCut / 1000).toFixed(1)} m
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CurrencyEurIcon className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{t("metricPrice")}</p>
                    <p className="font-mono text-lg font-bold text-primary">
                      €{totals.estimatedPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            <Button
              asChild
              size="lg"
              className="w-full bg-primary font-mono text-primary-foreground hover:bg-primary/90"
            >
              <Link href={parts.length > 0 ? "/signup" : "/signup"}>
                {parts.length > 0 ? (
                  <>
                    {t("ctaContinue")}
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  tHero("cta")
                )}
              </Link>
            </Button>
          </div>

          {/* Right: Sheet Canvas Preview */}
          <div className="relative">
            {/* Sheet dimensions label - positioned inside the container */}
            <div className="mb-2 font-mono text-xs text-muted-foreground">
              {t("sheetPreview")}
            </div>

            <svg
              viewBox={`0 0 ${SHEET_WIDTH} ${SHEET_HEIGHT}`}
              className="w-full border border-border bg-card/50"
              style={{ aspectRatio: `${SHEET_WIDTH} / ${SHEET_HEIGHT}` }}
            >
              {/* Grid pattern - uses CSS-aware colors via class */}
              <defs>
                <pattern id="smallGrid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path
                    d="M 100 0 L 0 0 0 100"
                    fill="none"
                    className="stroke-border/30"
                    strokeWidth="0.5"
                  />
                </pattern>
                <pattern id="largeGrid" width="500" height="500" patternUnits="userSpaceOnUse">
                  <rect width="500" height="500" fill="url(#smallGrid)" />
                  <path
                    d="M 500 0 L 0 0 0 500"
                    fill="none"
                    className="stroke-border/50"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>

              {/* Sheet background with grid */}
              <rect
                x={0}
                y={0}
                width={SHEET_WIDTH}
                height={SHEET_HEIGHT}
                fill="url(#largeGrid)"
              />

              {/* Sheet border */}
              <rect
                x={0}
                y={0}
                width={SHEET_WIDTH}
                height={SHEET_HEIGHT}
                fill="none"
                className="stroke-muted-foreground/50"
                strokeWidth="4"
              />

              {/* Placed parts */}
              {placements.map(({ part, x, y }) => (
                <g key={part.id} transform={`translate(${x}, ${y})`}>
                  <path
                    d={part.svgPath}
                    fill={part.color}
                    fillOpacity={0.3}
                    stroke={part.color}
                    strokeWidth="3"
                  />
                </g>
              ))}

              {/* Corner dimension labels */}
              <text
                x={SHEET_WIDTH / 2}
                y={40}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontFamily="ui-monospace, monospace"
                fontSize="28"
              >
                3000mm
              </text>
              <text
                x={50}
                y={SHEET_HEIGHT / 2}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontFamily="ui-monospace, monospace"
                fontSize="28"
                transform={`rotate(-90, 50, ${SHEET_HEIGHT / 2})`}
              >
                1500mm
              </text>

              {/* Empty state */}
              {parts.length === 0 && (
                <text
                  x={SHEET_WIDTH / 2}
                  y={SHEET_HEIGHT / 2}
                  textAnchor="middle"
                  className="fill-muted-foreground/50"
                  fontFamily="ui-monospace, monospace"
                  fontSize="48"
                >
                  {t("emptyPreview")}
                </text>
              )}

              {/* Utilization indicator */}
              {parts.length > 0 && (
                <g transform={`translate(${SHEET_WIDTH - 320}, ${SHEET_HEIGHT - 100})`}>
                  <rect
                    width="300"
                    height="80"
                    rx="4"
                    className="fill-card stroke-border"
                    strokeWidth="1"
                  />
                  <text
                    x="20"
                    y="30"
                    className="fill-muted-foreground"
                    fontFamily="ui-monospace, monospace"
                    fontSize="16"
                  >
                    {t("sheetUtilization")}
                  </text>
                  <text
                    x="20"
                    y="60"
                    className={totals.utilization > 0.7 ? "fill-primary" : "fill-foreground"}
                    fontFamily="ui-monospace, monospace"
                    fontSize="24"
                    fontWeight="bold"
                  >
                    {(totals.utilization * 100).toFixed(1)}%
                  </text>
                  {/* Progress bar background */}
                  <rect x="160" y="25" width="120" height="40" rx="2" className="fill-muted" />
                  {/* Progress bar fill */}
                  <rect
                    x="160"
                    y="25"
                    width={Math.min(120, 120 * totals.utilization)}
                    height="40"
                    rx="2"
                    className={totals.utilization > 0.7 ? "fill-primary" : "fill-blue-500"}
                  />
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
