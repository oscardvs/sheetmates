"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { NestingCanvas, CanvasToolbar } from "@/components/canvas";
import { DxfUploader, type UploadedPart } from "@/components/dxf-uploader";
import { NestingControls } from "@/components/nesting-controls";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useAppStore } from "@/lib/stores/app-store";
import { shelfPack } from "@/lib/nesting/shelf-packer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlaygroundPage() {
  const t = useTranslations("playground");
  const [uploadedParts, setUploadedParts] = useState<UploadedPart[]>([]);
  const [nestingLoading, setNestingLoading] = useState(false);

  const {
    sheetWidth,
    sheetHeight,
    setSheetDimensions,
    addPart,
    clearParts,
    parts,
  } = useCanvasStore();

  const { currentMaterial, setCurrentMaterial } = useAppStore();

  const [kerf, setKerf] = useState(2);

  const handlePartsReady = useCallback(
    (parts: UploadedPart[]) => {
      setUploadedParts(parts);
      // Add parts to canvas store at origin (will be nested later)
      clearParts();
      parts.forEach((part) => {
        for (let i = 0; i < part.quantity; i++) {
          addPart({
            partId: part.fileName,
            x: 0,
            y: 0,
            width: part.parsed.width,
            height: part.parsed.height,
            rotation: 0,
            svgPath: part.svgPath,
          });
        }
      });
    },
    [addPart, clearParts]
  );

  const handleRunNesting = useCallback(() => {
    setNestingLoading(true);

    // Convert uploaded parts to nesting input format
    const nestingParts = uploadedParts.map((p) => ({
      id: p.fileName,
      width: p.parsed.width,
      height: p.parsed.height,
      quantity: p.quantity,
      svgPath: p.svgPath,
    }));

    const sheet = { width: sheetWidth, height: sheetHeight };
    const result = shelfPack(nestingParts, sheet, kerf);

    // Update canvas with nesting results
    clearParts();
    result.placements.forEach((placement) => {
      const originalPart = uploadedParts.find(
        (p) => p.fileName === placement.partId
      );
      addPart({
        partId: placement.partId,
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        rotation: placement.rotation as 0 | 90 | 180 | 270,
        svgPath: originalPart?.svgPath,
      });
    });

    setNestingLoading(false);
  }, [uploadedParts, sheetWidth, sheetHeight, kerf, clearParts, addPart]);

  const utilization = (() => {
    const totalArea = parts.reduce((sum, p) => sum + p.width * p.height, 0);
    const sheetArea = sheetWidth * sheetHeight;
    return sheetArea > 0 ? totalArea / sheetArea : 0;
  })();

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b border-zinc-800 p-2">
        <CanvasToolbar
          onRunNesting={handleRunNesting}
          nestingLoading={nestingLoading}
        />
      </div>

      {/* Main content */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* Left sidebar - Upload & Controls */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full overflow-y-auto border-r border-zinc-800 p-4">
            <Tabs defaultValue="upload">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="flex-1">
                  {t("upload")}
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">
                  {t("settings")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <DxfUploader onPartsReady={handlePartsReady} />
              </TabsContent>

              <TabsContent value="settings" className="mt-4">
                <NestingControls
                  sheetWidth={sheetWidth}
                  sheetHeight={sheetHeight}
                  material={currentMaterial}
                  kerf={kerf}
                  utilization={utilization}
                  partsPlaced={parts.length}
                  onSheetWidthChange={(w) => setSheetDimensions(w, sheetHeight)}
                  onSheetHeightChange={(h) => setSheetDimensions(sheetWidth, h)}
                  onMaterialChange={setCurrentMaterial}
                  onKerfChange={setKerf}
                  onRunNesting={handleRunNesting}
                  loading={nestingLoading}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Canvas */}
        <ResizablePanel defaultSize={75}>
          <NestingCanvas className="h-full w-full" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
