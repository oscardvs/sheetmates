"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { parseDxfString, type ParsedDxf } from "@/lib/dxf/parser";
import { dxfToSvgPath } from "@/lib/dxf/to-svg";
import { computeArea } from "@/lib/dxf/compute-area";
import { computeCutLength } from "@/lib/dxf/compute-cut-length";
import { UploadIcon, XIcon, ArrowRightIcon } from "@phosphor-icons/react";
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
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed p-12 transition-colors ${
          dragOver
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-900/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("dxf-file-input")?.click()}
      >
        <div className="flex h-16 w-16 items-center justify-center border border-zinc-700 bg-zinc-800/50">
          <UploadIcon className="h-8 w-8 text-emerald-400" weight="light" />
        </div>
        <div className="text-center">
          <p className="font-mono text-sm font-medium text-white">{t("dragDrop")}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">{t("orBrowse")}</p>
          <p className="mt-2 font-mono text-xs text-zinc-600">{t("fileTypes")}</p>
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
          <div className="flex items-center gap-2">
            <div className="h-px w-4 bg-zinc-700" />
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
              {parts.length} {parts.length === 1 ? "FILE" : "FILES"} READY
            </span>
            <div className="h-px flex-1 bg-zinc-700" />
          </div>

          {parts.map((part, i) => (
            <div key={i} className="border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-start gap-4">
                <div className="border border-zinc-700 bg-zinc-950 p-2">
                  <DxfPreview
                    svgPath={part.svgPath}
                    width={part.parsed.width}
                    height={part.parsed.height}
                    boundingBox={part.parsed.boundingBox}
                    className="h-20 w-20 shrink-0"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-mono text-sm font-medium text-white">
                      {part.fileName}
                    </h4>
                    <button
                      onClick={() => removePart(i)}
                      className="flex h-6 w-6 items-center justify-center text-zinc-500 transition-colors hover:text-white"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-4 font-mono text-xs text-zinc-500">
                    <span>
                      {part.parsed.width.toFixed(1)} x {part.parsed.height.toFixed(1)} mm
                    </span>
                    <span>|</span>
                    <span>Area: {(part.area / 100).toFixed(2)} cm²</span>
                    <span>|</span>
                    <span>Cut: {part.cutLength.toFixed(1)} mm</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor={`qty-${i}`} className="font-mono text-xs text-zinc-400">
                      {t("quantity")}
                    </label>
                    <input
                      id={`qty-${i}`}
                      type="number"
                      min={1}
                      value={part.quantity}
                      onChange={(e) =>
                        updateQuantity(i, parseInt(e.target.value) || 1)
                      }
                      className="w-20 border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            className="group flex w-full items-center justify-center gap-2 bg-emerald-500 px-6 py-3 font-mono text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
            onClick={() => onPartsReady(parts)}
          >
            {t("confirm")}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </div>
  );
}
