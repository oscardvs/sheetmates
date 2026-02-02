"use client";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function LandingFooterLinks() {
  const { user } = useAuth();

  return (
    <div className="flex gap-6">
      <Link
        href="/pricing"
        className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Pricing
      </Link>
      {user ? (
        <Link
          href="/upload"
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Dashboard
        </Link>
      ) : (
        <Link
          href="/login"
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Login
        </Link>
      )}
    </div>
  );
}
