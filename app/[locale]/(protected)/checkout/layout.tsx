import type { Metadata } from "next";

// Checkout pages should not be indexed by search engines
export const metadata: Metadata = {
  title: "Checkout - SheetMates",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
