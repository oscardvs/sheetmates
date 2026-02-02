"use client";

import dynamic from "next/dynamic";

// Lazy-load the interactive canvas after hydration for better LCP
const LandingCanvasInteractive = dynamic(
  () => import("@/components/landing-canvas").then((mod) => mod.LandingCanvas),
  {
    ssr: false,
    loading: () => null, // Static version already visible underneath
  }
);

/**
 * Client component wrapper that lazy-loads the interactive canvas.
 * This component renders nothing until the interactive canvas loads,
 * allowing the static version underneath to be visible for fast LCP.
 */
export function LandingCanvasWrapper() {
  return <LandingCanvasInteractive />;
}
