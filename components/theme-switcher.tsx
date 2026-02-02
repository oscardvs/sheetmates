"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { SunIcon, MoonIcon, DesktopIcon } from "@phosphor-icons/react";

export function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("theme");

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  // Use resolvedTheme for the icon (handles SSR gracefully)
  const displayTheme = theme === "system" ? "system" : resolvedTheme;
  const Icon = displayTheme === "dark" ? MoonIcon : displayTheme === "light" ? SunIcon : DesktopIcon;
  const label = theme === "dark" ? t("dark") : theme === "light" ? t("light") : t("system");

  return (
    <button
      onClick={cycleTheme}
      className="flex h-8 items-center gap-1.5 border border-border bg-transparent px-2 font-mono text-xs text-foreground transition-colors hover:border-primary"
      title={label}
      suppressHydrationWarning
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline" suppressHydrationWarning>{label}</span>
    </button>
  );
}
