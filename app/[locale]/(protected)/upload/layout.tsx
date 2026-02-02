import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/metadata";

// SEO metadata for upload page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePageMetadata({
    title: "Upload DXF Files for Laser Cutting",
    description:
      "Upload your DXF files and get instant laser cutting quotes. Drag and drop CAD files, see real-time nesting visualization, and receive transparent pricing. Start your fabrication project now.",
    keywords: [
      "dxf upload",
      "laser cutting quote",
      "instant pricing",
      "cad file upload",
      "laser cutting estimation",
      "dxf to laser cutting",
      "upload design laser cutting",
    ],
    canonical: `/${locale}/upload`,
    locale,
  });
}

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
