"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DxfUploader, type UploadedPart } from "@/components/dxf-uploader";
import { useAuth } from "@/components/providers/auth-provider";
import { createPart } from "@/lib/firebase/db/parts";
import { uploadDxfFile } from "@/lib/firebase/storage";
import { toast } from "sonner";

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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      {uploading ? (
        <p className="text-muted-foreground">{t("uploading")}</p>
      ) : (
        <DxfUploader onPartsReady={handlePartsReady} />
      )}
    </div>
  );
}
