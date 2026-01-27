"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const t = useTranslations("languages");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onValueChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <Select value={locale} onValueChange={onValueChange}>
      <SelectTrigger className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t("en")}</SelectItem>
        <SelectItem value="fr">{t("fr")}</SelectItem>
        <SelectItem value="cs">{t("cs")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
