"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "cookie-consent";

export function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted || !isVisible) return null;

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
            <Link href="/cookies">{t("learnMore")}</Link>
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
