"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DxfUploader, type UploadedPart } from "@/components/dxf-uploader";
import { useAuth } from "@/components/providers/auth-provider";
import { createPart, getPart, type PartDoc } from "@/lib/firebase/db/parts";
import { uploadDxfFile } from "@/lib/firebase/storage";
import { autoNestParts, NoMatchingSheetError } from "@/lib/nesting/auto-nest";
import { toast } from "sonner";
import { UploadIcon, SpinnerIcon, CheckCircleIcon, CaretDownIcon } from "@phosphor-icons/react";

// Storage key matching landing-canvas
const LANDING_STORAGE_KEY = "sheetmates_landing_parts";

// Material options
const MATERIALS = [
  { value: "steel", label: "Steel" },
  { value: "stainless", label: "Stainless Steel" },
  { value: "aluminum", label: "Aluminum" },
  { value: "copper", label: "Copper" },
] as const;

// Thickness options in mm
const THICKNESSES = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20] as const;

interface RestoredPart {
  id: string;
  fileName: string;
  parsed: {
    width: number;
    height: number;
    entities: unknown[];
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
  };
  svgPath: string;
  area: number;
  cutLength: number;
  color: string;
}

export default function UploadPage() {
  const t = useTranslations("upload");
  const router = useRouter();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [restoredParts, setRestoredParts] = useState<RestoredPart[]>([]);
  const [showRestored, setShowRestored] = useState(false);
  const [material, setMaterial] = useState<string>("steel");
  const [thickness, setThickness] = useState<number>(2);

  // Check for parts from landing page on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(LANDING_STORAGE_KEY);
    if (saved) {
      try {
        const parts = JSON.parse(saved) as RestoredPart[];
        if (parts.length > 0) {
          setRestoredParts(parts);
          setShowRestored(true);
        }
      } catch (err) {
        console.error("Failed to restore landing parts:", err);
      }
      // Clear after reading
      sessionStorage.removeItem(LANDING_STORAGE_KEY);
    }
  }, []);

  async function handlePartsReady(parts: UploadedPart[]) {
    if (!user) return;
    setUploading(true);
    try {
      // Check if any parts were unit-converted
      const convertedParts = parts.filter((p) => p.parsed.wasConverted);
      if (convertedParts.length > 0) {
        const unit = convertedParts[0].parsed.detectedUnit;
        toast.info(t("unitConverted", { unit }));
      }

      // 1. Save parts to Firestore and collect their IDs
      const savedPartIds: string[] = [];
      for (const part of parts) {
        const downloadUrl = await uploadDxfFile(
          user.uid,
          part.fileName,
          part.file
        );
        const partId = await createPart({
          userId: user.uid,
          fileName: part.fileName,
          boundingBox: {
            width: part.parsed.width,
            height: part.parsed.height,
          },
          svgPath: part.svgPath,
          area: part.area,
          cutLength: part.cutLength,
          quantity: part.quantity,
          status: "pending",
          sheetId: null,
          position: null,
        });
        savedPartIds.push(partId);
        void downloadUrl;
      }

      // 2. Fetch the saved parts for auto-nesting
      const savedParts: PartDoc[] = [];
      for (const id of savedPartIds) {
        const part = await getPart(id);
        if (part) savedParts.push(part);
      }

      // 3. Auto-nest the parts onto a sheet
      try {
        const result = await autoNestParts(savedParts, material, thickness);

        // 4. Show appropriate toast
        if (result.unplacedPartIds.length > 0) {
          toast.warning(t("partsTooLarge", { count: result.unplacedPartIds.length }));
        }

        const utilizationPercent = (result.utilization * 100).toFixed(1);
        toast.success(t("nestedSuccess", { utilization: utilizationPercent }));

        setShowRestored(false);
        setRestoredParts([]);

        // 5. Redirect to sheet view to see the nested parts
        router.push(`/sheets/${result.sheetId}`);
      } catch (nestError) {
        if (nestError instanceof NoMatchingSheetError) {
          // No matching sheet - parts saved but not nested
          toast.warning(t("noMatchingSheet", { material, thickness }));
          setShowRestored(false);
          setRestoredParts([]);
          // Redirect to queue - parts are saved with pending status
          router.push("/queue");
        } else {
          throw nestError;
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(t("error"));
    } finally {
      setUploading(false);
    }
  }

  function dismissRestored() {
    setShowRestored(false);
    setRestoredParts([]);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px w-8 bg-primary" />
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            {t("badge")}
          </span>
        </div>
        <h1 className="font-mono text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* Restored parts notification */}
      {showRestored && restoredParts.length > 0 && (
        <div className="border border-primary/50 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-primary" weight="fill" />
            <div className="flex-1">
              <p className="font-mono text-sm font-medium text-foreground">
                {t("restoredTitle")}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {t("restoredMessage", {
                  count: restoredParts.length,
                  plural: restoredParts.length > 1 ? "s" : ""
                })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {restoredParts.map((part) => (
                  <span
                    key={part.id}
                    className="inline-flex items-center gap-1.5 border border-border bg-background px-2 py-1 font-mono text-xs"
                  >
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: part.color }}
                    />
                    {part.fileName}
                    <span className="text-muted-foreground">
                      ({part.parsed.width.toFixed(0)}×{part.parsed.height.toFixed(0)}mm)
                    </span>
                  </span>
                ))}
              </div>
              <button
                onClick={dismissRestored}
                className="mt-3 font-mono text-xs text-muted-foreground underline hover:text-foreground"
              >
                {t("dismiss")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material & Thickness Selector */}
      <div className="border border-border bg-card/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-4 bg-border" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("sheetConfig")}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Material selector */}
          <div className="flex-1 min-w-[140px]">
            <label className="block font-mono text-xs text-muted-foreground mb-1.5">
              {t("material")}
            </label>
            <div className="relative">
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full appearance-none border border-border bg-background px-3 py-2 pr-8 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {MATERIALS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <CaretDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          {/* Thickness selector */}
          <div className="flex-1 min-w-[140px]">
            <label className="block font-mono text-xs text-muted-foreground mb-1.5">
              {t("thickness")}
            </label>
            <div className="relative">
              <select
                value={thickness}
                onChange={(e) => setThickness(Number(e.target.value))}
                className="w-full appearance-none border border-border bg-background px-3 py-2 pr-8 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {THICKNESSES.map((th) => (
                  <option key={th} value={th}>
                    {th} mm
                  </option>
                ))}
              </select>
              <CaretDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {uploading ? (
        <div className="flex flex-col items-center justify-center gap-4 border border-border bg-muted/50 p-12">
          <SpinnerIcon className="h-10 w-10 animate-spin text-primary" />
          <p className="font-mono text-sm text-muted-foreground">{t("uploading")}</p>
        </div>
      ) : (
        <DxfUploader onPartsReady={handlePartsReady} />
      )}

      {/* Help section */}
      <div className="border border-border bg-card/30 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-card/50">
            <UploadIcon className="h-5 w-5 text-muted-foreground" weight="light" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-semibold text-foreground">{t("helpTitle")}</h3>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {t("helpDescription")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
