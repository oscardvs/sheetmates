"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { logout } from "@/lib/firebase/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ListIcon, UserIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";

export function Navbar() {
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
    : [];

  const adminLinks =
    userDoc?.role === "admin"
      ? [{ href: "/admin" as const, label: t("admin") }]
      : [];

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-mono text-lg font-bold tracking-tight text-foreground"
        >
          SheetMates
        </Link>

        {/* Desktop nav - center (only shown when logged in) */}
        {navLinks.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side controls */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Pricing link for non-logged-in users */}
          {!user && (
            <Link
              href="/pricing"
              className="px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("pricing")}
            </Link>
          )}

          <LanguageSwitcher />
          <ThemeSwitcher />

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => logout()}
                className="px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("logout")}
              </button>
              <Link
                href="/account/orders"
                className="flex items-center gap-1.5 border border-border bg-transparent px-3 py-1.5 font-mono text-sm text-foreground transition-colors hover:border-primary"
              >
                <UserIcon className="h-4 w-4" />
                <span className="max-w-[120px] truncate">
                  {userDoc?.displayName || user.email?.split("@")[0]}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("login")}
              </Link>
              <Link
                href="/signup"
                className="bg-primary px-4 py-2 font-mono text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("signup")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-8 w-8 items-center justify-center text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <XIcon className="h-5 w-5" />
          ) : (
            <ListIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {/* Pricing link for non-logged-in users */}
            {!user && (
              <Link
                href="/pricing"
                className="px-3 py-2 font-mono text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {t("pricing")}
              </Link>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 font-mono text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 font-mono text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="my-2 h-px bg-border" />

            <div className="flex items-center gap-2 px-3 py-2">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>

            <div className="my-2 h-px bg-border" />

            {user ? (
              <>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-2 px-3 py-2 font-mono text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  <UserIcon className="h-4 w-4" />
                  {t("account")}
                </Link>
                <button
                  className="px-3 py-2 text-left font-mono text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 font-mono text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("login")}
                </Link>
                <Link
                  href="/signup"
                  className="mx-3 my-2 bg-primary px-4 py-2 text-center font-mono text-sm font-medium text-primary-foreground"
                  onClick={() => setMobileOpen(false)}
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
