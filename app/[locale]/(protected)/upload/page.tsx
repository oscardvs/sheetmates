"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DxfUploader, type UploadedPart } from "@/components/dxf-uploader";
import { useAuth } from "@/components/providers/auth-provider";
import { createPart } from "@/lib/firebase/db/parts";
import { uploadDxfFile } from "@/lib/firebase/storage";
import { toast } from "sonner";
import { UploadIcon, SpinnerIcon, CheckCircleIcon } from "@phosphor-icons/react";

// Storage key matching landing-canvas
const LANDING_STORAGE_KEY = "sheetmates_landing_parts";

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
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [restoredParts, setRestoredParts] = useState<RestoredPart[]>([]);
  const [showRestored, setShowRestored] = useState(false);

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
      for (const part of parts) {
        const downloadUrl = await uploadDxfFile(
          user.uid,
          part.fileName,
          part.file
        );
        await createPart({
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
        void downloadUrl;
      }
      toast.success(t("success"));
      setShowRestored(false);
      setRestoredParts([]);
    } catch {
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
