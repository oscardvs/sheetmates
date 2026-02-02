"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CheckCircleIcon, ArrowRightIcon, ListIcon } from "@phosphor-icons/react";

export default function CheckoutSuccessPage() {
  const t = useTranslations("checkout");

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
          <p className="font-mono text-xs text-muted-foreground">
            Your order confirmation has been sent to your email.
            You can track your order status in the queue.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/queue"
            className="group flex w-full items-center justify-center gap-2 bg-primary px-6 py-3 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ListIcon className="h-4 w-4" />
            View Order Queue
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
