"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ListIcon,
  SpinnerIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

type VerifyState =
  | { status: "loading" }
  | { status: "paid"; orderId: string | null }
  | { status: "pending" }
  | { status: "error" };

export default function CheckoutSuccessPage() {
  const t = useTranslations("checkout");
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<VerifyState>(() =>
    sessionId ? { status: "loading" } : { status: "error" }
  );

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.paid) {
          setState({ status: "paid", orderId: data.orderId });
        } else if (data.paymentStatus) {
          setState({ status: "pending" });
        } else {
          setState({ status: "error" });
        }
      })
      .catch(() => setState({ status: "error" }));
  }, [sessionId]);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <SpinnerIcon className="h-10 w-10 animate-spin text-primary" />
          <p className="font-mono text-sm text-muted-foreground">
            {t("verifying")}
          </p>
        </div>
      </div>
    );
  }

  if (state.status !== "paid") {
    const pending = state.status === "pending";
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border border-amber-500/30 bg-amber-500/10">
            <WarningCircleIcon className="h-10 w-10 text-amber-500" weight="fill" />
          </div>
          <h1 className="mb-4 font-mono text-2xl font-bold text-foreground">
            {pending ? t("paymentPending") : t("paymentUnverified")}
          </h1>
          <p className="mb-8 font-mono text-sm text-muted-foreground">
            {pending ? t("paymentPendingMessage") : t("paymentUnverifiedMessage")}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/queue"
              className="group flex w-full items-center justify-center gap-2 bg-primary px-6 py-3 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ListIcon className="h-4 w-4" />
              {t("viewQueue")}
            </Link>
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 border border-border bg-card/30 px-6 py-3 font-mono text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-card/50"
            >
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border border-primary/30 bg-primary/10">
          <CheckCircleIcon className="h-10 w-10 text-primary" weight="fill" />
        </div>

        {/* Title */}
        <h1 className="mb-4 font-mono text-2xl font-bold text-foreground">
          {t("success")}
        </h1>

        {/* Message */}
        <p className="mb-8 font-mono text-sm text-muted-foreground">
          {t("successMessage")}
        </p>

        {/* Order details hint */}
        <div className="mb-8 border border-border bg-muted/50 p-4">
          {state.orderId && (
            <p className="mb-1 font-mono text-xs text-foreground">
              {t("orderRef")}: {state.orderId}
            </p>
          )}
          <p className="font-mono text-xs text-muted-foreground">
            {t("successHint")}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/queue"
            className="group flex w-full items-center justify-center gap-2 bg-primary px-6 py-3 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ListIcon className="h-4 w-4" />
            {t("viewQueue")}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 border border-border bg-card/30 px-6 py-3 font-mono text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-card/50"
          >
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
