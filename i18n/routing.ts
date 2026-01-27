import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr", "cs"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
