"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { GlobeIcon } from "@phosphor-icons/react";

export function LanguageSwitcher() {
  const t = useTranslations("languages");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onValueChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => onValueChange(e.target.value)}
        className="h-8 appearance-none border border-border bg-background pl-7 pr-3 font-mono text-xs text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none"
      >
        <option value="en" className="bg-background text-foreground">{t("en")}</option>
        <option value="fr" className="bg-background text-foreground">{t("fr")}</option>
        <option value="cs" className="bg-background text-foreground">{t("cs")}</option>
      </select>
      <GlobeIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
