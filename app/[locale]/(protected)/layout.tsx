"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/protected-route";
import { Navbar } from "@/components/navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex min-h-screen flex-col bg-zinc-950">
          <Navbar variant="dark" />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-zinc-800 bg-zinc-950 py-6">
            <div className="mx-auto max-w-7xl px-4">
              <div className="font-mono text-xs text-zinc-600">
                © 2026 SheetMates. Belgian-incorporated. All data hosted in EU (europe-west1).
              </div>
            </div>
          </footer>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
