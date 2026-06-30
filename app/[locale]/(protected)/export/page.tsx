"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getAllSheets, type SheetDoc } from "@/lib/firebase/db/sheets";
import { useAuth } from "@/components/providers/auth-provider";
import { downloadSheetDxf } from "@/lib/export/download-sheet-dxf";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ExportPage() {
  const t = useTranslations("export");
  const { user } = useAuth();
  const [sheets, setSheets] = useState<SheetDoc[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getAllSheets().then(setSheets);
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDownload() {
    if (!user) {
      toast.error(t("loginRequired"));
      return;
    }
    setDownloading(true);
    try {
      const idToken = await user.getIdToken();
      let totalSkipped = 0;
      // Sequential so each file save dialog/blob is handled cleanly.
      for (const id of selected) {
        const { skipped } = await downloadSheetDxf(id, idToken);
        totalSkipped += skipped;
      }
      if (totalSkipped > 0) {
        toast.warning(t("downloadPartial", { count: totalSkipped }));
      } else {
        toast.success(t("downloadStarted"));
      }
    } catch (err) {
      console.error("DXF download failed:", err);
      toast.error(err instanceof Error ? err.message : t("downloadError"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      {sheets.length === 0 ? (
        <p className="text-muted-foreground">{t("noSheets")}</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Sheet</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheets.map((sheet) => (
                <TableRow key={sheet.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(sheet.id)}
                      onCheckedChange={() => toggleSelect(sheet.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {sheet.width} x {sheet.height} mm
                  </TableCell>
                  <TableCell>{sheet.material}</TableCell>
                  <TableCell>
                    {(sheet.utilization * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Button
            onClick={handleDownload}
            disabled={selected.size === 0 || downloading}
          >
            {t("generateDxf")} & {t("download")}
          </Button>
        </>
      )}
    </div>
  );
}
