"use client";

import { useEffect, useState, use } from "react";
import { getSheet, type SheetDoc } from "@/lib/firebase/db/sheets";
import { getPartsByStatus, getPartsBySheetId, type PartDoc } from "@/lib/firebase/db/parts";
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
  const [pendingParts, setPendingParts] = useState<PartDoc[]>([]);
  const [sheetParts, setSheetParts] = useState<PartDoc[]>([]);
  const [placements, setPlacements] = useState<NestingPlacement[]>([]);
  const [sheetWidth, setSheetWidth] = useState(2500);
  const [sheetHeight, setSheetHeight] = useState(1250);
  const [material, setMaterial] = useState("steel");
  const [kerf, setKerf] = useState(2);
  const [utilization, setUtilization] = useState(0);

  useEffect(() => {
    async function loadData() {
      const [sheet, pending, onSheet] = await Promise.all([
        getSheet(id),
        getPartsByStatus("pending"),
        getPartsBySheetId(id),
      ]);

      if (sheet) {
        setSheet(sheet);
        setSheetWidth(sheet.width);
        setSheetHeight(sheet.height);
        setMaterial(sheet.material);
        if (sheet.placements.length > 0) {
          setPlacements(
            sheet.placements.map((p) => ({
              partId: p.partId,
              sheetIndex: 0,
              x: p.x,
              y: p.y,
              width: p.width,
              height: p.height,
              rotation: p.rotation,
            }))
          );
          setUtilization(sheet.utilization);
        }
      }

      setPendingParts(pending);
      setSheetParts(onSheet);
    }

    loadData();
  }, [id]);

  function handleRunNesting() {
    // Combine parts already on the sheet with pending parts
    const allParts = [
      ...sheetParts.map((p) => ({
        id: p.id,
        width: p.boundingBox.width,
        height: p.boundingBox.height,
        quantity: p.quantity,
        svgPath: p.svgPath,
      })),
      ...pendingParts.map((p) => ({
        id: p.id,
        width: p.boundingBox.width,
        height: p.boundingBox.height,
        quantity: p.quantity,
        svgPath: p.svgPath,
      })),
    ];

    const result = shelfPack(
      allParts,
      { width: sheetWidth, height: sheetHeight },
      kerf
    );

    const sheetZeroPlacements = result.placements.filter(
      (p) => p.sheetIndex === 0
    );
    setPlacements(sheetZeroPlacements);
    setUtilization(result.utilization[0] || 0);
  }

  // Build SVG paths from both sheet parts and pending parts
  const partSvgPaths: Record<string, string> = {};
  for (const p of sheetParts) {
    partSvgPaths[p.id] = p.svgPath;
  }
  for (const p of pendingParts) {
    partSvgPaths[p.id] = p.svgPath;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/sheets"
            className="mb-2 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="h-3 w-3" />
            Back to Sheets
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-foreground">
              Nesting Playground
            </h1>
            <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
              {id.slice(0, 8)}
            </span>
          </div>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          {sheetParts.length} on sheet, {pendingParts.length} pending
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <div className="border border-border bg-card p-4">
          <SheetViewer
            sheetWidth={sheetWidth}
            sheetHeight={sheetHeight}
            placements={placements}
            partSvgPaths={partSvgPaths}
          />
        </div>

        {/* Controls */}
        <aside className="border border-border bg-muted/50 p-6">
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
