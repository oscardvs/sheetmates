import type { Metadata } from "next";

// Login page should not be indexed by search engines
export const metadata: Metadata = {
  title: "Login - SheetMates",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
