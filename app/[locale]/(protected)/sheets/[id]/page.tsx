"use client";

import { useEffect, useState, use } from "react";
import { getSheet, type SheetDoc } from "@/lib/firebase/db/sheets";
import { getPartsByStatus, type PartDoc } from "@/lib/firebase/db/parts";
import { SheetViewer } from "@/components/sheet-viewer";
import { NestingControls } from "@/components/nesting-controls";
import { shelfPack } from "@/lib/nesting";
import type { NestingPlacement } from "@/lib/nesting/types";
import { Link } from "@/i18n/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react";

export default function SheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [_sheet, setSheet] = useState<SheetDoc | null>(null);
  const [parts, setParts] = useState<PartDoc[]>([]);
  const [placements, setPlacements] = useState<NestingPlacement[]>([]);
  const [sheetWidth, setSheetWidth] = useState(2500);
  const [sheetHeight, setSheetHeight] = useState(1250);
  const [material, setMaterial] = useState("steel");
  const [kerf, setKerf] = useState(2);
  const [utilization, setUtilization] = useState(0);

  useEffect(() => {
    getSheet(id).then((s) => {
      if (s) {
        setSheet(s);
        setSheetWidth(s.width);
        setSheetHeight(s.height);
        setMaterial(s.material);
        if (s.placements.length > 0) {
          setPlacements(
            s.placements.map((p) => ({
              partId: p.partId,
              sheetIndex: 0,
              x: p.x,
              y: p.y,
              width: p.width,
              height: p.height,
              rotation: p.rotation,
            }))
          );
          setUtilization(s.utilization);
        }
      }
    });
    getPartsByStatus("pending").then(setParts);
  }, [id]);

  function handleRunNesting() {
    const nestingParts = parts.map((p) => ({
      id: p.id,
      width: p.boundingBox.width,
      height: p.boundingBox.height,
      quantity: p.quantity,
      svgPath: p.svgPath,
    }));

    const result = shelfPack(
      nestingParts,
      { width: sheetWidth, height: sheetHeight },
      kerf
    );

    const sheetZeroPlacements = result.placements.filter(
      (p) => p.sheetIndex === 0
    );
    setPlacements(sheetZeroPlacements);
    setUtilization(result.utilization[0] || 0);
  }

  const partSvgPaths: Record<string, string> = {};
  for (const p of parts) {
    partSvgPaths[p.id] = p.svgPath;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/sheets"
            className="mb-2 inline-flex items-center gap-1 font-mono text-xs text-zinc-500 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="h-3 w-3" />
            Back to Sheets
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-white">
              Nesting Playground
            </h1>
            <span className="border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-400">
              {id.slice(0, 8)}
            </span>
          </div>
        </div>
        <div className="font-mono text-xs text-zinc-500">
          {parts.length} pending {parts.length === 1 ? "part" : "parts"}
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <div className="border border-zinc-800 bg-zinc-950 p-4">
          <SheetViewer
            sheetWidth={sheetWidth}
            sheetHeight={sheetHeight}
            placements={placements}
            partSvgPaths={partSvgPaths}
          />
        </div>

        {/* Controls */}
        <aside className="border border-zinc-800 bg-zinc-900/50 p-6">
          <NestingControls
            sheetWidth={sheetWidth}
            sheetHeight={sheetHeight}
            material={material}
            kerf={kerf}
            utilization={utilization}
            partsPlaced={placements.length}
            onSheetWidthChange={setSheetWidth}
            onSheetHeightChange={setSheetHeight}
            onMaterialChange={setMaterial}
            onKerfChange={setKerf}
            onRunNesting={handleRunNesting}
          />
        </aside>
      </div>
    </div>
  );
}
