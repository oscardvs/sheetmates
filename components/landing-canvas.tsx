"use client";

import { useCallback, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { parseDxfString, type ParsedDxf } from "@/lib/dxf/parser";
import { dxfToSvgPath } from "@/lib/dxf/to-svg";
import { computeArea } from "@/lib/dxf/compute-area";
import { computeCutLength } from "@/lib/dxf/compute-cut-length";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  ArrowRight,
  X,
  Crosshair,
  Ruler,
  Scissors,
  CurrencyEur,
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
  "rgb(16, 185, 129)", // emerald-500
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

export function LandingCanvas() {
  const t = useTranslations("landing");
  const [parts, setParts] = useState<UploadedPart[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    <section className="relative bg-zinc-950 text-white">
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(63, 63, 70) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(63, 63, 70) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      
      <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge 
            variant="outline" 
            className="mb-4 border-emerald-500/50 bg-emerald-500/10 font-mono text-emerald-400"
          >
            TECH-CENTRUM // BUFFER SHEET NETWORK
          </Badge>
          <h1 className="mb-4 font-mono text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            <span className="text-zinc-400">DROP </span>
            <span className="text-emerald-400">.DXF</span>
            <span className="text-zinc-400"> → GET </span>
            <span className="text-emerald-400">PARTS</span>
          </h1>
          <p className="mx-auto max-w-2xl font-mono text-sm text-zinc-400 md:text-base">
            Upload your CAD files. We nest them with other makers. You pay only for your share.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Drop Zone & Parts List */}
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed p-8 transition-all ${
                dragOver
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-zinc-700 hover:border-emerald-400/50 hover:bg-zinc-900/50"
              } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("landing-dxf-input")?.click()}
            >
              <Upload className={`h-12 w-12 ${dragOver ? "text-emerald-400" : "text-zinc-500"}`} />
              <div className="text-center">
                <p className="font-mono text-lg font-medium text-white">
                  {isProcessing ? "PROCESSING..." : "DROP DXF FILES HERE"}
                </p>
                <p className="font-mono text-xs text-zinc-500">
                  or click to browse • supports .dxf
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
                  <span className="font-mono text-xs text-zinc-500">
                    LOADED PARTS ({parts.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 font-mono text-xs text-zinc-500 hover:text-white"
                    onClick={() => setParts([])}
                  >
                    CLEAR ALL
                  </Button>
                </div>
                
                <div className="max-h-[200px] space-y-1 overflow-y-auto">
                  {parts.map((part) => (
                    <div
                      key={part.id}
                      className="group flex items-center gap-3 bg-zinc-900/50 px-3 py-2"
                    >
                      <div 
                        className="h-3 w-3 rounded-sm" 
                        style={{ backgroundColor: part.color }}
                      />
                      <span className="flex-1 truncate font-mono text-xs text-white">
                        {part.fileName}
                      </span>
                      <span className="font-mono text-xs text-zinc-500">
                        {part.parsed.width.toFixed(0)}×{part.parsed.height.toFixed(0)}
                      </span>
                      <button
                        onClick={() => removePart(part.id)}
                        className="text-zinc-600 opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Panel */}
            {parts.length > 0 && (
              <div className="grid grid-cols-2 gap-2 border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="font-mono text-xs text-zinc-500">PARTS</p>
                    <p className="font-mono text-lg font-bold text-white">
                      {totals.partCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="font-mono text-xs text-zinc-500">AREA</p>
                    <p className="font-mono text-lg font-bold text-white">
                      {(totals.totalArea / 100).toFixed(0)} cm²
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="font-mono text-xs text-zinc-500">CUT LENGTH</p>
                    <p className="font-mono text-lg font-bold text-white">
                      {(totals.totalCut / 1000).toFixed(1)} m
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CurrencyEur className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="font-mono text-xs text-zinc-500">EST. PRICE</p>
                    <p className="font-mono text-lg font-bold text-emerald-400">
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
              className="w-full bg-emerald-500 font-mono hover:bg-emerald-600"
            >
              <Link href={parts.length > 0 ? "/signup" : "/signup"}>
                {parts.length > 0 ? (
                  <>
                    CONTINUE TO NEST
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "GET STARTED"
                )}
              </Link>
            </Button>
          </div>

          {/* Right: Sheet Canvas Preview */}
          <div className="relative">
            <div className="absolute -left-4 top-0 font-mono text-xs text-zinc-600">
              3000mm × 1500mm SHEET
            </div>
            
            <svg
              viewBox={`-20 -20 ${SHEET_WIDTH + 40} ${SHEET_HEIGHT + 40}`}
              className="w-full border border-zinc-800 bg-zinc-950"
              style={{ aspectRatio: `${SHEET_WIDTH} / ${SHEET_HEIGHT}` }}
            >
              {/* Grid lines */}
              <defs>
                <pattern id="smallGrid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path 
                    d="M 100 0 L 0 0 0 100" 
                    fill="none" 
                    stroke="rgb(39, 39, 42)" 
                    strokeWidth="0.5"
                  />
                </pattern>
                <pattern id="largeGrid" width="500" height="500" patternUnits="userSpaceOnUse">
                  <rect width="500" height="500" fill="url(#smallGrid)" />
                  <path 
                    d="M 500 0 L 0 0 0 500" 
                    fill="none" 
                    stroke="rgb(63, 63, 70)" 
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
                stroke="rgb(100, 116, 139)"
                strokeWidth="2"
                strokeOpacity="0.5"
              />
              
              {/* Dimension labels */}
              <text
                x={SHEET_WIDTH / 2}
                y={-8}
                textAnchor="middle"
                fill="rgb(113, 113, 122)"
                fontFamily="JetBrains Mono, monospace"
                fontSize="24"
              >
                3000mm
              </text>
              <text
                x={-8}
                y={SHEET_HEIGHT / 2}
                textAnchor="middle"
                fill="rgb(113, 113, 122)"
                fontFamily="JetBrains Mono, monospace"
                fontSize="24"
                transform={`rotate(-90, -8, ${SHEET_HEIGHT / 2})`}
              >
                1500mm
              </text>

              {/* Placed parts */}
              {placements.map(({ part, x, y }) => (
                <g key={part.id} transform={`translate(${x}, ${y})`}>
                  <path
                    d={part.svgPath}
                    fill={part.color}
                    fillOpacity={0.2}
                    stroke={part.color}
                    strokeWidth="2"
                  />
                </g>
              ))}

              {/* Empty state */}
              {parts.length === 0 && (
                <text
                  x={SHEET_WIDTH / 2}
                  y={SHEET_HEIGHT / 2}
                  textAnchor="middle"
                  fill="rgb(63, 63, 70)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="48"
                >
                  DROP FILES TO PREVIEW
                </text>
              )}

              {/* Utilization indicator */}
              {parts.length > 0 && (
                <g transform={`translate(${SHEET_WIDTH - 300}, ${SHEET_HEIGHT - 80})`}>
                  <rect
                    width="280"
                    height="60"
                    fill="rgb(24, 24, 27)"
                    stroke="rgb(63, 63, 70)"
                    strokeWidth="1"
                  />
                  <text
                    x="20"
                    y="25"
                    fill="rgb(161, 161, 170)"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="14"
                  >
                    UTILIZATION
                  </text>
                  <text
                    x="20"
                    y="48"
                    fill={totals.utilization > 0.7 ? "rgb(16, 185, 129)" : "rgb(255, 255, 255)"}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="20"
                    fontWeight="bold"
                  >
                    {(totals.utilization * 100).toFixed(1)}%
                  </text>
                  {/* Mini bar */}
                  <rect x="150" y="20" width="110" height="30" fill="rgb(39, 39, 42)" />
                  <rect 
                    x="150" 
                    y="20" 
                    width={Math.min(110, 110 * totals.utilization)} 
                    height="30" 
                    fill={totals.utilization > 0.7 ? "rgb(16, 185, 129)" : "rgb(59, 130, 246)"}
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
