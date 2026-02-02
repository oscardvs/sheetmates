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
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border border-emerald-500/30 bg-emerald-500/10">
          <CheckCircleIcon className="h-10 w-10 text-emerald-400" weight="fill" />
        </div>

        {/* Title */}
        <h1 className="mb-4 font-mono text-2xl font-bold text-white">
          {t("success")}
        </h1>

        {/* Message */}
        <p className="mb-8 font-mono text-sm text-zinc-400">
          {t("successMessage")}
        </p>

        {/* Order details hint */}
        <div className="mb-8 border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="font-mono text-xs text-zinc-500">
            Your order confirmation has been sent to your email.
            You can track your order status in the queue.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/queue"
            className="group flex w-full items-center justify-center gap-2 bg-emerald-500 px-6 py-3 font-mono text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
          >
            <ListIcon className="h-4 w-4" />
            View Order Queue
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 border border-zinc-700 bg-zinc-800/30 px-6 py-3 font-mono text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
