"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/navbar";

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen flex-col">
        <Navbar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </AuthProvider>
  );
}
