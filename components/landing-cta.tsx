"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ArrowRightIcon } from "@phosphor-icons/react";

export function LandingCta() {
  const t = useTranslations("landing");
  const { user } = useAuth();

  if (user) {
    // Logged-in user: show "Go to Dashboard" CTA
    return (
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="mb-4 font-mono text-3xl font-bold text-foreground md:text-4xl">
          {t("footerCta.loggedInTitle")}
        </h2>
        <p className="mb-8 font-mono text-sm text-muted-foreground">
          {t("footerCta.loggedInTagline")}
        </p>
        <Link
          href="/upload"
          className="group inline-flex items-center gap-2 bg-primary px-8 py-4 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("footerCta.loggedInCta")}
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    );
  }

  // Not logged in: show signup CTA
  return (
    <div className="relative mx-auto max-w-4xl px-4 py-20 text-center">
      <h2 className="mb-4 font-mono text-3xl font-bold text-foreground md:text-4xl">
        {t("footerCta.title")}
      </h2>
      <p className="mb-8 font-mono text-sm text-muted-foreground">
        {t("footerCta.tagline")}
      </p>
      <Link
        href="/signup"
        className="group inline-flex items-center gap-2 bg-primary px-8 py-4 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("footerCta.cta")}
        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
