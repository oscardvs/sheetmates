"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAllSheets, type SheetDoc } from "@/lib/firebase/db/sheets";
import { generateNestingDxf } from "@/lib/export/dxf-writer";
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
  const [sheets, setSheets] = useState<SheetDoc[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  function handleDownload() {
    for (const sheet of sheets.filter((s) => selected.has(s.id))) {
      const placements = sheet.placements.map((p) => ({
        partId: p.partId,
        sheetIndex: 0,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        rotation: p.rotation,
      }));

      const dxfContent = generateNestingDxf(
        placements,
        sheet.width,
        sheet.height
      );
      const blob = new Blob([dxfContent], { type: "application/dxf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sheet-${sheet.id}.dxf`;
      a.click();
      URL.revokeObjectURL(url);
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
            disabled={selected.size === 0}
          >
            {t("generateDxf")} & {t("download")}
          </Button>
        </>
      )}
    </div>
  );
}
