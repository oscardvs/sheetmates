"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { parseDxfString, type ParsedDxf } from "@/lib/dxf/parser";
import { dxfToSvgPath } from "@/lib/dxf/to-svg";
import { computeArea } from "@/lib/dxf/compute-area";
import { computeCutLength } from "@/lib/dxf/compute-cut-length";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "@phosphor-icons/react";
import { DxfPreview } from "@/components/dxf-preview";

export interface UploadedPart {
  fileName: string;
  file: File;
  parsed: ParsedDxf;
  svgPath: string;
  area: number;
  cutLength: number;
  quantity: number;
}

interface DxfUploaderProps {
  onPartsReady: (parts: UploadedPart[]) => void;
}

export function DxfUploader({ onPartsReady }: DxfUploaderProps) {
  const t = useTranslations("upload");
  const [parts, setParts] = useState<UploadedPart[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
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
          fileName: file.name,
          file,
          parsed,
          svgPath,
          area,
          cutLength,
          quantity: 1,
        });
      } catch (err) {
        console.error(`Failed to parse ${file.name}:`, err);
      }
    }
    setParts((prev) => [...prev, ...newParts]);
  }, []);

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

  const updateQuantity = (index: number, quantity: number) => {
    setParts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, quantity: Math.max(1, quantity) } : p))
    );
  };

  const removePart = (index: number) => {
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("dxf-file-input")?.click()}
      >
        <Upload className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium">{t("dragDrop")}</p>
          <p className="text-sm text-muted-foreground">{t("orBrowse")}</p>
          <p className="text-xs text-muted-foreground">{t("fileTypes")}</p>
        </div>
        <input
          id="dxf-file-input"
          type="file"
          accept=".dxf"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Part list */}
      {parts.length > 0 && (
        <div className="space-y-4">
          {parts.map((part, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{part.fileName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <DxfPreview
                    svgPath={part.svgPath}
                    width={part.parsed.width}
                    height={part.parsed.height}
                    boundingBox={part.parsed.boundingBox}
                    className="h-24 w-24 shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {part.parsed.width.toFixed(1)} x{" "}
                      {part.parsed.height.toFixed(1)} mm
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Area: {part.area.toFixed(1)} mm&sup2; | Cut:{" "}
                      {part.cutLength.toFixed(1)} mm
                    </p>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`qty-${i}`} className="text-xs">
                        {t("quantity")}
                      </Label>
                      <Input
                        id={`qty-${i}`}
                        type="number"
                        min={1}
                        value={part.quantity}
                        onChange={(e) =>
                          updateQuantity(i, parseInt(e.target.value) || 1)
                        }
                        className="w-20"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePart(i)}
                  >
                    &times;
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            className="w-full"
            onClick={() => onPartsReady(parts)}
          >
            {t("confirm")}
          </Button>
        </div>
      )}
    </div>
  );
}
