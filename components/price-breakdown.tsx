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
        <span className="text-muted-foreground">{t("perArea")}</span>
        <span className="text-foreground/80">{fmt(breakdown.areaCost)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t("perCut")}</span>
        <span className="text-foreground/80">{fmt(breakdown.cutCost)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground/70">{t("material")} multiplier</span>
        <span className="text-muted-foreground/70">x{breakdown.materialMultiplier.toFixed(1)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground/70">{t("thickness")} multiplier</span>
        <span className="text-muted-foreground/70">x{breakdown.thicknessMultiplier.toFixed(1)}</span>
      </div>
      {breakdown.bulkDiscount > 0 && (
        <div className="flex justify-between">
          <span className="text-primary">Bulk discount</span>
          <span className="text-primary">-{fmt(breakdown.bulkDiscount)}</span>
        </div>
      )}
      <div className="my-2 h-px bg-border" />
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          Unit price x {quantity}
        </span>
        <span className="text-foreground/80">{fmt(breakdown.pricePerUnit)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t("subtotal")}</span>
        <span className="text-foreground/80">{fmt(breakdown.totalBeforeVat)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground/70">{t("vat")}</span>
        <span className="text-muted-foreground/70">{fmt(breakdown.vat)}</span>
      </div>
      <div className="my-2 h-px bg-border" />
      <div className="flex justify-between text-base font-bold">
        <span className="text-foreground">{t("total")}</span>
        <span className="text-primary">{fmt(breakdown.total)}</span>
      </div>
    </div>
  );
}
