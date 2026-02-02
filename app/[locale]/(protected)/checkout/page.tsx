"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getPartsByUser,
  type PartDoc,
} from "@/lib/firebase/db/parts";
import { createOrder } from "@/lib/firebase/db/orders";
import { calculatePartPrice } from "@/lib/pricing/engine";
import { PriceBreakdownDisplay } from "@/components/price-breakdown";
import { Link } from "@/i18n/navigation";
import {
  ShoppingCartIcon,
  ArrowRightIcon,
  SpinnerIcon,
  LockIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tPricing = useTranslations("pricing");
  const { user } = useAuth();
  const [parts, setParts] = useState<PartDoc[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getPartsByUser(user.uid).then((all) =>
        setParts(all.filter((p) => p.status === "pending" || p.status === "nested"))
      );
    }
  }, [user]);

  const breakdowns = parts.map((part) =>
    calculatePartPrice({
      areaMm2: part.area,
      cutLengthMm: part.cutLength,
      material: "steel",
      thickness: "2",
      quantity: part.quantity,
    })
  );

  const grandTotal = breakdowns.reduce((sum, b) => sum + b.total, 0);
  const totalBeforeVat = breakdowns.reduce((s, b) => s + b.totalBeforeVat, 0);
  const totalVat = breakdowns.reduce((s, b) => s + b.vat, 0);

  async function handlePay() {
    if (!user || parts.length === 0) return;
    setLoading(true);

    try {
      const items = parts.map((part, i) => ({
        partId: part.id,
        fileName: part.fileName,
        quantity: part.quantity,
        pricePerUnit: breakdowns[i].pricePerUnit,
        total: breakdowns[i].total,
      }));

      const orderId = await createOrder({
        userId: user.uid,
        items,
        subtotal: totalBeforeVat,
        vat: totalVat,
        total: grandTotal,
        status: "pending",
        stripeSessionId: null,
      });

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: parts.map((part, i) => ({
            name: part.fileName,
            quantity: part.quantity,
            priceInCents: Math.round(breakdowns[i].pricePerUnit * 100),
          })),
          orderId,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/queue"
          className="mb-2 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="h-3 w-3" />
          {t("backToQueue")}
        </Link>
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

      {parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 border border-border bg-muted/50 py-20">
          <div className="flex h-16 w-16 items-center justify-center border border-border bg-card/50">
            <ShoppingCartIcon className="h-8 w-8 text-muted-foreground" weight="light" />
          </div>
          <p className="font-mono text-sm text-foreground">{t("emptyState")}</p>
          <Link
            href="/upload"
            className="font-mono text-xs text-primary transition-colors hover:text-primary/80"
          >
            {t("emptyStateCta")}
          </Link>
        </div>
      ) : (
        <>
          {/* Parts list */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px w-4 bg-border" />
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {t("itemCount", {
                  count: parts.length,
                  type: parts.length === 1 ? t("itemSingular") : t("itemPlural")
                })}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {parts.map((part, i) => (
              <div key={part.id} className="border border-border bg-muted/50 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-mono text-sm font-medium text-foreground">
                    {part.fileName}
                  </h3>
                  <span className="font-mono text-xs text-muted-foreground">
                    x{part.quantity}
                  </span>
                </div>
                <PriceBreakdownDisplay
                  breakdown={breakdowns[i]}
                  quantity={part.quantity}
                />
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="border border-border bg-muted/50 p-6">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {t("orderSummary")}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">{tPricing("subtotal")}</span>
                <span className="font-mono text-sm text-foreground">
                  €{totalBeforeVat.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">{tPricing("vat")}</span>
                <span className="font-mono text-sm text-foreground">
                  €{totalVat.toFixed(2)}
                </span>
              </div>
              <div className="my-3 h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-foreground">{tPricing("total")}</span>
                <span className="font-mono text-2xl font-bold text-primary">
                  €{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 bg-primary px-6 py-4 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <SpinnerIcon className="h-4 w-4 animate-spin" />
                {t("processing")}
              </>
            ) : (
              <>
                <LockIcon className="h-4 w-4" weight="fill" />
                {t("pay")} - €{grandTotal.toFixed(2)}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-muted-foreground/70">
            <LockIcon className="h-3 w-3" />
            <span>{t("securityNote")}</span>
          </div>
        </>
      )}
    </div>
  );
}
