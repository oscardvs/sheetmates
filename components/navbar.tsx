"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { logout } from "@/lib/firebase/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListIcon, UserIcon } from "@phosphor-icons/react";
import { useState } from "react";

interface NavbarProps {
  variant?: "default" | "dark";
}

export function Navbar({ variant = "dark" }: NavbarProps) {
  const t = useTranslations("nav");
  const { user, userDoc } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = user
    ? [
        { href: "/upload" as const, label: t("upload") },
        { href: "/sheets" as const, label: t("sheets") },
        { href: "/queue" as const, label: t("queue") },
        { href: "/export" as const, label: t("export") },
        { href: "/pricing" as const, label: t("pricing") },
      ]
    : [{ href: "/pricing" as const, label: t("pricing") }];

  const adminLinks =
    userDoc?.role === "admin"
      ? [{ href: "/admin" as const, label: t("admin") }]
      : [];

  const isDark = variant === "dark";

  return (
    <header
      className={`border-b ${
        isDark
          ? "border-zinc-800 bg-zinc-950/95 backdrop-blur"
          : "border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className={`font-mono text-lg font-bold tracking-tight ${
            isDark ? "text-white" : ""
          }`}
        >
          SheetMates
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 font-mono text-sm transition-colors ${
                isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 font-mono text-sm transition-colors ${
                isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeSwitcher />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    isDark
                      ? "border-zinc-700 bg-transparent font-mono text-white hover:bg-zinc-800"
                      : "font-mono"
                  }
                >
                  <UserIcon className="mr-1 h-4 w-4" />
                  {userDoc?.displayName || user.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/account/orders">{t("account")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                className={`px-3 py-2 font-mono text-sm transition-colors ${
                  isDark
                    ? "text-zinc-400 hover:text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("login")}
              </Link>
              <Link
                href="/signup"
                className={`px-4 py-2 font-mono text-sm font-medium transition-colors ${
                  isDark
                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {t("signup")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className={`md:hidden ${isDark ? "text-white hover:bg-zinc-800" : ""}`}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <ListIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className={`border-t px-4 py-2 md:hidden ${
            isDark ? "border-zinc-800 bg-zinc-950" : ""
          }`}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 font-mono text-sm ${
                  isDark ? "text-zinc-400 hover:text-white" : ""
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 font-mono text-sm ${
                  isDark ? "text-zinc-400 hover:text-white" : ""
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 py-2">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
            {user ? (
              <>
                <Link
                  href="/account/orders"
                  className={`px-3 py-2 font-mono text-sm ${
                    isDark ? "text-zinc-400 hover:text-white" : ""
                  }`}
                >
                  {t("account")}
                </Link>
                <button
                  className={`px-3 py-2 text-left font-mono text-sm ${
                    isDark ? "text-zinc-400 hover:text-white" : ""
                  }`}
                  onClick={() => logout()}
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`px-3 py-2 font-mono text-sm ${
                    isDark ? "text-zinc-400 hover:text-white" : ""
                  }`}
                >
                  {t("login")}
                </Link>
                <Link
                  href="/signup"
                  className={`mx-3 my-2 px-4 py-2 text-center font-mono text-sm font-medium ${
                    isDark
                      ? "bg-emerald-500 text-black"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {t("signup")}
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
