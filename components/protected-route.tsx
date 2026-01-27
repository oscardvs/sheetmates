"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

export function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && adminOnly && userDoc?.role !== "admin") {
      router.replace("/");
    }
  }, [user, userDoc, loading, adminOnly, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;
  if (adminOnly && userDoc?.role !== "admin") return null;

  return <>{children}</>;
}
