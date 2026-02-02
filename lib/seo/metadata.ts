import type { Metadata } from "next";

/**
 * SEO Metadata Configuration
 */

export const SITE_CONFIG = {
  name: "SheetMates",
  title: "SheetMates - Community-Driven Laser Cutting Platform",
  description:
    "Transform industrial buffer sheets into precision laser-cut parts. Upload DXF files, get instant pricing, and access EU-based CNC manufacturing at maker-friendly prices.",
  url: "https://sheetmates.com",
  ogImage: "https://sheetmates.com/og-image.png",
  keywords: [
    "laser cutting service",
    "sheet metal fabrication",
    "dxf laser cutting",
    "CNC manufacturing",
    "buffer sheets",
    "maker fabrication",
    "laser cutting Belgium",
    "affordable laser cutting",
    "prototype manufacturing",
  ],
} as const;

export interface PageMetadataInput {
  title: string;
  description: string;
  keywords?: readonly string[] | string[];
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  locale?: string;
}

/**
 * Generate metadata for a page
 * Handles title templates, OG tags, and SEO best practices
 */
export function generatePageMetadata(
  input: PageMetadataInput
): Metadata {
  const {
    title,
    description,
    keywords = [],
    ogImage,
    canonical,
    noindex = false,
    locale = "en",
  } = input;

  // Construct full title with site name
  const fullTitle = title.includes("SheetMates")
    ? title
    : `${title} | SheetMates`;

  // Merge page keywords with global keywords
  const allKeywords = [...new Set([...SITE_CONFIG.keywords, ...keywords])];

  // Construct canonical URL
  const canonicalUrl = canonical
    ? `${SITE_CONFIG.url}${canonical}`
    : undefined;

  // OpenGraph image
  const ogImageUrl = ogImage || SITE_CONFIG.ogImage;

  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    ...(canonicalUrl && { alternates: { canonical: canonicalUrl } }),
    ...(noindex && { robots: { index: false, follow: false } }),
    openGraph: {
      type: "website",
      locale,
      url: canonicalUrl || SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * Generate metadata for material pages
 */
export function generateMaterialMetadata(
  material: string,
  locale: string = "en"
): Metadata {
  const materialNames: Record<string, string> = {
    steel: "Steel",
    aluminum: "Aluminum",
    stainless: "Stainless Steel",
    copper: "Copper",
  };

  const materialName = materialNames[material] || material;

  return generatePageMetadata({
    title: `${materialName} Laser Cutting Service`,
    description: `Precision ${materialName.toLowerCase()} laser cutting from industrial buffer sheets. Upload DXF, get instant pricing. Fast turnaround, EU-based manufacturing.`,
    keywords: [
      `${materialName.toLowerCase()} laser cutting`,
      `${materialName.toLowerCase()} sheet cutting`,
      `${materialName.toLowerCase()} fabrication`,
      `laser cut ${materialName.toLowerCase()} parts`,
      `${materialName.toLowerCase()} CNC cutting`,
    ],
    canonical: `/${locale}/materials/${material}`,
    locale,
  });
}

/**
 * Generate metadata for material thickness pages
 */
export function generateThicknessMetadata(
  material: string,
  thickness: string,
  locale: string = "en"
): Metadata {
  const materialNames: Record<string, string> = {
    steel: "Steel",
    aluminum: "Aluminum",
    stainless: "Stainless Steel",
    copper: "Copper",
  };

  const materialName = materialNames[material] || material;

  return generatePageMetadata({
    title: `${thickness}mm ${materialName} Laser Cutting`,
    description: `${thickness}mm ${materialName.toLowerCase()} laser cutting service. Precision CNC cutting with fast turnaround. Upload DXF for instant quote. EU-based manufacturing.`,
    keywords: [
      `${thickness}mm ${materialName.toLowerCase()} laser cutting`,
      `${thickness}mm ${materialName.toLowerCase()} sheet`,
      `laser cut ${thickness}mm ${materialName.toLowerCase()}`,
    ],
    canonical: `/${locale}/materials/${material}/${thickness}`,
    locale,
  });
}

/**
 * Generate metadata for guide pages
 */
export function generateGuideMetadata(
  title: string,
  description: string,
  slug: string,
  keywords: string[] = [],
  locale: string = "en"
): Metadata {
  return generatePageMetadata({
    title,
    description,
    keywords: [
      ...keywords,
      "laser cutting guide",
      "dxf tutorial",
      "fabrication tips",
    ],
    canonical: `/${locale}/guides/${slug}`,
    locale,
  });
}

/**
 * Generate metadata for FAQ pages
 */
export function generateFAQMetadata(
  question: string,
  answer: string,
  category: string,
  slug: string,
  locale: string = "en"
): Metadata {
  return generatePageMetadata({
    title: question,
    description: answer.slice(0, 160), // Truncate for meta description
    keywords: [
      "laser cutting faq",
      "laser cutting questions",
      category,
    ],
    canonical: `/${locale}/faq/${category}/${slug}`,
    locale,
  });
}

/**
 * Generate metadata for competitor comparison pages
 */
export function generateComparisonMetadata(
  competitor: string,
  locale: string = "en"
): Metadata {
  const competitorNames: Record<string, string> = {
    fractory: "Fractory",
    xometry: "Xometry",
    hubs: "Hubs",
    protolabs: "Protolabs",
  };

  const competitorName = competitorNames[competitor] || competitor;

  return generatePageMetadata({
    title: `SheetMates vs ${competitorName}: Comparison & Review`,
    description: `Compare SheetMates and ${competitorName} for laser cutting services. Honest comparison of pricing, features, turnaround times, and best use cases.`,
    keywords: [
      `${competitorName} alternative`,
      `SheetMates vs ${competitorName}`,
      `cheaper than ${competitorName}`,
      `${competitorName} comparison`,
      "laser cutting comparison",
    ],
    canonical: `/${locale}/vs/${competitor}`,
    locale,
  });
}

/**
 * Generate locale alternates for a page
 */
export function generateLocaleAlternates(
  pathname: string
): Record<string, string> {
  const locales = ["en", "fr", "cs"];
  const alternates: Record<string, string> = {};

  locales.forEach((locale) => {
    alternates[locale] = `${SITE_CONFIG.url}/${locale}${pathname}`;
  });

  return alternates;
}
