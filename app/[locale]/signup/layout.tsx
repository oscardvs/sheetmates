import type { Metadata } from "next";

// Signup page should not be indexed by search engines
export const metadata: Metadata = {
  title: "Sign Up - SheetMates",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
