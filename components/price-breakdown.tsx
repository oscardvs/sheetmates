"use client";

import { useTranslations } from "next-intl";
import type { PriceBreakdown } from "@/lib/pricing/engine";

interface PriceBreakdownDisplayProps {
  breakdown: PriceBreakdown;
  quantity: number;
}

export function PriceBreakdownDisplay({
  breakdown,
  quantity,
}: PriceBreakdownDisplayProps) {
  const t = useTranslations("pricing");

  const fmt = (n: number) => `€${n.toFixed(2)}`;

  return (
    <div className="space-y-2 font-mono text-sm">
      <div className="flex justify-between">
        <span className="text-zinc-400">{t("perArea")}</span>
        <span className="text-zinc-300">{fmt(breakdown.areaCost)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-400">{t("perCut")}</span>
        <span className="text-zinc-300">{fmt(breakdown.cutCost)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-500">{t("material")} multiplier</span>
        <span className="text-zinc-500">x{breakdown.materialMultiplier.toFixed(1)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-500">{t("thickness")} multiplier</span>
        <span className="text-zinc-500">x{breakdown.thicknessMultiplier.toFixed(1)}</span>
      </div>
      {breakdown.bulkDiscount > 0 && (
        <div className="flex justify-between">
          <span className="text-emerald-400">Bulk discount</span>
          <span className="text-emerald-400">-{fmt(breakdown.bulkDiscount)}</span>
        </div>
      )}
      <div className="my-2 h-px bg-zinc-800" />
      <div className="flex justify-between">
        <span className="text-zinc-400">
          Unit price x {quantity}
        </span>
        <span className="text-zinc-300">{fmt(breakdown.pricePerUnit)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-400">{t("subtotal")}</span>
        <span className="text-zinc-300">{fmt(breakdown.totalBeforeVat)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-500">{t("vat")}</span>
        <span className="text-zinc-500">{fmt(breakdown.vat)}</span>
      </div>
      <div className="my-2 h-px bg-zinc-800" />
      <div className="flex justify-between text-base font-bold">
        <span className="text-white">{t("total")}</span>
        <span className="text-emerald-400">{fmt(breakdown.total)}</span>
      </div>
    </div>
  );
}
