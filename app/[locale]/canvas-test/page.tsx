"use client";

import { useState, useCallback } from "react";
import { NestingCanvas, CanvasToolbar } from "@/components/canvas";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { shelfPack } from "@/lib/nesting/shelf-packer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Test page to verify canvas without auth
export default function CanvasTestPage() {
  const [nestingLoading, setNestingLoading] = useState(false);
  const { sheetWidth, sheetHeight, addPart, clearParts, parts } = useCanvasStore();

  // Add some test parts
  const addTestParts = useCallback(() => {
    clearParts();
    // Add various sized parts
    const testParts = [
      { width: 200, height: 150, count: 3 },
      { width: 300, height: 100, count: 2 },
      { width: 150, height: 150, count: 4 },
      { width: 400, height: 200, count: 2 },
    ];

    testParts.forEach((p, idx) => {
      for (let i = 0; i < p.count; i++) {
        addPart({
          partId: `part-${idx}`,
          x: Math.random() * 500,
          y: Math.random() * 500,
          width: p.width,
          height: p.height,
          rotation: 0,
        });
      }
    });
  }, [addPart, clearParts]);

  const handleRunNesting = useCallback(() => {
    setNestingLoading(true);

    // Get unique part types
    const partTypes = new Map<string, { width: number; height: number; count: number }>();
    parts.forEach((p) => {
      const key = `${p.width}x${p.height}`;
      const existing = partTypes.get(key);
      if (existing) {
        existing.count++;
      } else {
        partTypes.set(key, { width: p.width, height: p.height, count: 1 });
      }
    });

    const nestingParts = Array.from(partTypes.entries()).map(([key, data], idx) => ({
      id: `part-${idx}`,
      width: data.width,
      height: data.height,
      quantity: data.count,
    }));

    const sheet = { width: sheetWidth, height: sheetHeight };
    const result = shelfPack(nestingParts, sheet, 2);

    clearParts();
    result.placements.forEach((placement) => {
      addPart({
        partId: placement.partId,
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        rotation: placement.rotation as 0 | 90 | 180 | 270,
      });
    });

    setNestingLoading(false);
  }, [parts, sheetWidth, sheetHeight, clearParts, addPart]);

  const utilization = (() => {
    const totalArea = parts.reduce((sum, p) => sum + p.width * p.height, 0);
    const sheetArea = sheetWidth * sheetHeight;
    return sheetArea > 0 ? totalArea / sheetArea : 0;
  })();

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4">
        <h1 className="text-xl font-bold text-white">Canvas Test Page</h1>
        <p className="text-sm text-zinc-400">Testing Konva canvas without Firebase auth</p>
      </div>

      {/* Toolbar */}
      <div className="border-b border-zinc-800 p-2">
        <CanvasToolbar onRunNesting={handleRunNesting} nestingLoading={nestingLoading} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-zinc-800 p-4">
          <Card className="border-zinc-700 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm">Test Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={addTestParts} className="w-full">
                Add Test Parts
              </Button>
              <Button onClick={clearParts} variant="outline" className="w-full">
                Clear All
              </Button>
              <div className="space-y-1 text-sm">
                <p className="text-zinc-400">Parts: <span className="text-white">{parts.length}</span></p>
                <p className="text-zinc-400">Utilization: <span className="text-white">{(utilization * 100).toFixed(1)}%</span></p>
                <p className="text-zinc-400">Sheet: <span className="text-white">{sheetWidth} x {sheetHeight} mm</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <NestingCanvas className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
