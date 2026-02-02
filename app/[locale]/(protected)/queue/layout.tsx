import type { Metadata } from "next";

// Queue page should not be indexed by search engines
export const metadata: Metadata = {
  title: "Production Queue - SheetMates",
  robots: {
    index: false,
    follow: false,
  },
};

export default function QueueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
