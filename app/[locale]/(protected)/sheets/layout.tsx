import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/metadata";

// SEO metadata for sheets browse page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePageMetadata({
    title: "Available Buffer Sheets - Live Inventory",
    description:
      "Browse live inventory of industrial buffer sheets available for laser cutting. See real-time material availability, thickness options, and utilization rates. Steel, aluminum, stainless steel, and copper sheets in stock.",
    keywords: [
      "buffer sheets",
      "available sheets",
      "material inventory",
      "laser cutting sheets",
      "sheet metal stock",
      "live inventory",
      "steel sheets available",
      "aluminum sheets stock",
    ],
    canonical: `/${locale}/sheets`,
    locale,
  });
}

export default function SheetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
