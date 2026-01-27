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
import { List, User } from "@phosphor-icons/react";
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
    : [{ href: "/pricing" as const, label: t("pricing") }];

  const adminLinks =
    userDoc?.role === "admin"
      ? [{ href: "/admin" as const, label: t("admin") }]
      : [];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          SheetMates
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          {adminLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeSwitcher />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="mr-1 h-4 w-4" />
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
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">{t("signup")}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <List className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t px-4 py-2 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                className="justify-start"
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            {adminLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                className="justify-start"
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            <div className="flex items-center gap-2 py-2">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  asChild
                >
                  <Link href="/account/orders">{t("account")}</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => logout()}
                >
                  {t("logout")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">{t("login")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">{t("signup")}</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
