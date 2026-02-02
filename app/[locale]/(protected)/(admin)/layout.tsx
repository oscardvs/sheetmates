"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { AdminSidebar } from "@/components/admin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute adminOnly>
      <div className="flex h-screen">
        <AdminSidebar />
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
