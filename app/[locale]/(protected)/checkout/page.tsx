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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
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

      const totalBeforeVat = breakdowns.reduce(
        (s, b) => s + b.totalBeforeVat,
        0
      );
      const vat = breakdowns.reduce((s, b) => s + b.vat, 0);

      const orderId = await createOrder({
        userId: user.uid,
        items,
        subtotal: totalBeforeVat,
        vat,
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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      {parts.length === 0 ? (
        <p className="text-muted-foreground">No parts to checkout.</p>
      ) : (
        <>
          {parts.map((part, i) => (
            <Card key={part.id}>
              <CardHeader>
                <CardTitle className="text-sm">{part.fileName}</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceBreakdownDisplay
                  breakdown={breakdowns[i]}
                  quantity={part.quantity}
                />
              </CardContent>
            </Card>
          ))}

          <Separator />

          <div className="flex items-center justify-between text-lg font-bold">
            <span>{t("orderSummary")}</span>
            <span>€{grandTotal.toFixed(2)}</span>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? t("processing") : t("pay")}
          </Button>
        </>
      )}
    </div>
  );
}
