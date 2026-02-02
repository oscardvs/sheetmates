"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAllSheets, type SheetDoc } from "@/lib/firebase/db/sheets";
import { GridFourIcon, ArrowRightIcon, SpinnerIcon } from "@phosphor-icons/react";

export default function SheetsPage() {
  const t = useTranslations("sheets");
  const [sheets, setSheets] = useState<SheetDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllSheets()
      .then(setSheets)
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "full":
        return "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "cutting":
        return "text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
      case "done":
        return "text-muted-foreground border-border bg-muted/50";
      default:
        return "text-muted-foreground border-border bg-muted/50";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <SpinnerIcon className="h-8 w-8 animate-spin text-primary" />
        <p className="font-mono text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px w-8 bg-primary" />
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            {t("badge")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-3xl font-bold text-foreground">{t("title")}</h1>
          <div className="font-mono text-xs text-muted-foreground">
            {t("sheetCount", {
              count: sheets.length,
              type: sheets.length === 1 ? t("sheetSingular") : t("sheetPlural")
            })}
          </div>
        </div>
      </div>

      {sheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 border border-border bg-muted/50 py-20">
          <div className="flex h-16 w-16 items-center justify-center border border-border bg-card/50">
            <GridFourIcon className="h-8 w-8 text-muted-foreground" weight="light" />
          </div>
          <p className="font-mono text-sm text-foreground">{t("noSheets")}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {t("emptyStateMessage")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("dimensions")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("material")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("utilization")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("placements")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("status")}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sheets.map((sheet) => (
                <tr
                  key={sheet.id}
                  className="border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-4 font-mono text-sm text-foreground">
                    {sheet.width} x {sheet.height} mm
                  </td>
                  <td className="px-4 py-4 font-mono text-sm capitalize text-muted-foreground">
                    {sheet.material}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${sheet.utilization * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm text-primary">
                        {(sheet.utilization * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-muted-foreground">
                    {sheet.placements.length}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block border px-2 py-0.5 font-mono text-xs uppercase ${statusColor(sheet.status)}`}
                    >
                      {sheet.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/sheets/${sheet.id}`}
                      className="group inline-flex items-center gap-1 font-mono text-xs text-primary transition-colors hover:text-primary/80"
                    >
                      {t("view")}
                      <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
