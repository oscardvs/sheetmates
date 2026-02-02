"use client";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useTranslations } from "next-intl";

export function LandingFooterLinks() {
  const { user } = useAuth();
  const t = useTranslations("footer");

  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
      {/* Main links */}
      <Link
        href="/pricing"
        className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("pricing")}
      </Link>
      <Link
        href="/faq"
        className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("faq")}
      </Link>
      <Link
        href="/contact"
        className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("contact")}
      </Link>
      {user ? (
        <Link
          href="/upload"
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Dashboard
        </Link>
      ) : (
        <Link
          href="/login"
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Login
        </Link>
      )}

      {/* Legal links */}
      <span className="text-muted-foreground/50">|</span>
      <Link
        href="/privacy"
        className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("privacy")}
      </Link>
      <Link
        href="/terms"
        className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("terms")}
      </Link>
      <Link
        href="/cookies"
        className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("cookies")}
      </Link>
    </div>
  );
}
