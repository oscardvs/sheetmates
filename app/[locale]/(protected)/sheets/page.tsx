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
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "full":
        return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "cutting":
        return "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
      case "done":
        return "text-zinc-400 border-zinc-500/30 bg-zinc-500/10";
      default:
        return "text-zinc-400 border-zinc-700 bg-zinc-800/50";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <SpinnerIcon className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="font-mono text-sm text-zinc-500">Loading sheets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px w-8 bg-emerald-500" />
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">
            LIVE SHEETS
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-3xl font-bold text-white">{t("title")}</h1>
          <div className="font-mono text-xs text-zinc-500">
            {sheets.length} {sheets.length === 1 ? "sheet" : "sheets"} available
          </div>
        </div>
      </div>

      {sheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 border border-zinc-800 bg-zinc-900/50 py-20">
          <div className="flex h-16 w-16 items-center justify-center border border-zinc-700 bg-zinc-800/50">
            <GridFourIcon className="h-8 w-8 text-zinc-600" weight="light" />
          </div>
          <p className="font-mono text-sm text-zinc-500">{t("noSheets")}</p>
          <p className="font-mono text-xs text-zinc-600">
            Upload parts to see them nested into sheets
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500">
                  {t("dimensions")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500">
                  {t("material")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500">
                  {t("utilization")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500">
                  {t("placements")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500">
                  {t("status")}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sheets.map((sheet) => (
                <tr
                  key={sheet.id}
                  className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/30"
                >
                  <td className="px-4 py-4 font-mono text-sm text-white">
                    {sheet.width} x {sheet.height} mm
                  </td>
                  <td className="px-4 py-4 font-mono text-sm capitalize text-zinc-300">
                    {sheet.material}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-zinc-800">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${sheet.utilization * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm text-emerald-400">
                        {(sheet.utilization * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-zinc-300">
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
                      className="group inline-flex items-center gap-1 font-mono text-xs text-emerald-400 transition-colors hover:text-emerald-300"
                    >
                      View
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
