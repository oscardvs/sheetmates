"use client";

import { useState, useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "cookie-consent";

// Subscribe to nothing - we just need the mounted check
const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // Client: mounted
    () => false  // Server: not mounted
  );
}

function getConsent(): boolean {
  if (typeof window === "undefined") return true; // Assume consent on server
  return localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
}

export function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const isMounted = useIsMounted();
  const [hasConsent, setHasConsent] = useState(getConsent);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setHasConsent(true);
  };

  // Don't render on server or if consent already given
  if (!isMounted || hasConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-900">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row">
        <p className="font-mono text-xs text-zinc-400">
          {t("message")}
        </p>
        <div className="flex shrink-0 gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="font-mono text-xs text-zinc-400 hover:text-zinc-100"
          >
            <Link href="/cookies" aria-label={t("learnMoreAriaLabel")}>{t("learnMore")}</Link>
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="bg-emerald-600 font-mono text-xs hover:bg-emerald-700"
          >
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
