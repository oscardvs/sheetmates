"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  HardDrivesIcon,
  QueueIcon,
  CurrencyDollarIcon,
  GearIcon,
  SignOutIcon,
  PackageIcon,
} from "@phosphor-icons/react";

const navItems = [
  { href: "/admin", icon: HardDrivesIcon, labelKey: "inventory" },
  { href: "/admin/queue", icon: QueueIcon, labelKey: "productionQueue" },
  { href: "/admin/orders", icon: PackageIcon, labelKey: "orders" },
  { href: "/admin/pricing", icon: CurrencyDollarIcon, labelKey: "pricing" },
  { href: "/admin/settings", icon: GearIcon, labelKey: "settings" },
];

export function AdminSidebar() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-zinc-800 px-4">
        <span className="font-mono text-lg font-bold">SheetMates</span>
        <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-500">
          ADMIN
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-white">
          <SignOutIcon className="h-5 w-5" />
          {t("logout")}
        </button>
      </div>
    </div>
  );
}
