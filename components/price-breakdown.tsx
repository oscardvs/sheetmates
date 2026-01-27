"use client";

import { useTranslations } from "next-intl";
import type { PriceBreakdown } from "@/lib/pricing/engine";
import { Separator } from "@/components/ui/separator";

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
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>{t("perArea")}</span>
        <span>{fmt(breakdown.areaCost)}</span>
      </div>
      <div className="flex justify-between">
        <span>{t("perCut")}</span>
        <span>{fmt(breakdown.cutCost)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>{t("material")} multiplier</span>
        <span>x{breakdown.materialMultiplier.toFixed(1)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>{t("thickness")} multiplier</span>
        <span>x{breakdown.thicknessMultiplier.toFixed(1)}</span>
      </div>
      {breakdown.bulkDiscount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Bulk discount</span>
          <span>-{fmt(breakdown.bulkDiscount)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between">
        <span>
          Unit price x {quantity}
        </span>
        <span>{fmt(breakdown.pricePerUnit)}</span>
      </div>
      <div className="flex justify-between">
        <span>{t("subtotal")}</span>
        <span>{fmt(breakdown.totalBeforeVat)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>{t("vat")}</span>
        <span>{fmt(breakdown.vat)}</span>
      </div>
      <Separator />
      <div className="flex justify-between text-base font-bold">
        <span>{t("total")}</span>
        <span>{fmt(breakdown.total)}</span>
      </div>
    </div>
  );
}
