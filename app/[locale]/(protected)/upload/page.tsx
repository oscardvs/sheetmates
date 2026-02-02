"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DxfUploader, type UploadedPart } from "@/components/dxf-uploader";
import { useAuth } from "@/components/providers/auth-provider";
import { createPart } from "@/lib/firebase/db/parts";
import { uploadDxfFile } from "@/lib/firebase/storage";
import { toast } from "sonner";
import { UploadIcon, SpinnerIcon } from "@phosphor-icons/react";

export default function UploadPage() {
  const t = useTranslations("upload");
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

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
        void downloadUrl; // stored in Firebase Storage, URL available via storage
      }
      toast.success(t("success"));
    } catch {
      toast.error(t("error"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px w-8 bg-emerald-500" />
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">
            STEP 1
          </span>
        </div>
        <h1 className="font-mono text-3xl font-bold text-white">{t("title")}</h1>
        <p className="mt-2 font-mono text-sm text-zinc-400">
          Upload your DXF files and we&apos;ll calculate the area and cut length automatically
        </p>
      </div>

      {uploading ? (
        <div className="flex flex-col items-center justify-center gap-4 border border-zinc-800 bg-zinc-900/50 p-12">
          <SpinnerIcon className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="font-mono text-sm text-zinc-400">{t("uploading")}</p>
        </div>
      ) : (
        <DxfUploader onPartsReady={handlePartsReady} />
      )}

      {/* Help section */}
      <div className="border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-zinc-700 bg-zinc-800/50">
            <UploadIcon className="h-5 w-5 text-zinc-400" weight="light" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-semibold text-white">Supported Formats</h3>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              We accept DXF files (R12-R2018). For best results, export with polylines and ensure all entities are on layer 0.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
