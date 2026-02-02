"use client";

import { useEffect, useState, use } from "react";
import { getSheet, type SheetDoc } from "@/lib/firebase/db/sheets";
import { getPartsByStatus, type PartDoc } from "@/lib/firebase/db/parts";
import { SheetViewer } from "@/components/sheet-viewer";
import { NestingControls } from "@/components/nesting-controls";
import { shelfPack } from "@/lib/nesting";
import type { NestingPlacement } from "@/lib/nesting/types";

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
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        <SheetViewer
          sheetWidth={sheetWidth}
          sheetHeight={sheetHeight}
          placements={placements}
          partSvgPaths={partSvgPaths}
        />
      </div>
      <aside>
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
  );
}
