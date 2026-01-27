"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/protected-route";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Navbar />
        <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-7xl px-4 py-8">
          {children}
        </main>
        <Footer />
      </ProtectedRoute>
    </AuthProvider>
  );
}
