import type { WithContext, Organization, Product, BreadcrumbList, FAQPage, Article } from "schema-dts";

/**
 * JSON-LD Schema Builders for SheetMates
 * Following schema.org specifications for rich search results
 */

/**
 * Organization schema - Use on every page
 * Establishes SheetMates as a legitimate business entity
 */
export function createOrganizationSchema(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SheetMates",
    url: "https://sheetmates.com",
    logo: "https://sheetmates.com/sheetmates_logo_full.png",
    description:
      "Community-driven laser cutting platform transforming industrial buffer sheets into precision fabricated parts",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BE",
      addressLocality: "Belgium",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "hello@sheetmates.com",
    },
    sameAs: [
      // Add social media profiles when available
      // "https://linkedin.com/company/sheetmates",
      // "https://twitter.com/sheetmates",
    ],
  };
}

/**
 * Product schema for sheet listings
 * Helps Google understand pricing and availability
 */
export interface SheetProductData {
  id: string;
  material: string;
  thickness: number;
  width: number;
  height: number;
  price?: number;
  currency?: string;
  availability: "InStock" | "OutOfStock" | "PreOrder";
}

export function createProductSchema(
  sheet: SheetProductData
): WithContext<Product> {
  const productName = `${sheet.thickness}mm ${sheet.material} Sheet - ${sheet.width}x${sheet.height}mm`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: `Laser cutting service on ${sheet.thickness}mm ${sheet.material} sheet from industrial buffer stock. Precision CNC cutting with fast turnaround.`,
    sku: sheet.id,
    offers: {
      "@type": "Offer",
      price: sheet.price?.toString(),
      priceCurrency: sheet.currency || "EUR",
      availability: `https://schema.org/${sheet.availability}`,
      url: `https://sheetmates.com/sheets/${sheet.id}`,
      priceValidUntil: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // 30 days
    },
    brand: {
      "@type": "Brand",
      name: "SheetMates",
    },
    category: "Laser Cutting Service",
  };
}

/**
 * BreadcrumbList schema for navigation context
 * Helps Google understand site structure
 */
export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function createBreadcrumbSchema(
  items: BreadcrumbItem[]
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://sheetmates.com${item.path}`,
    })),
  };
}

/**
 * FAQ schema for question pages
 * Enables rich snippets in search results
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export function createFAQSchema(items: FAQItem[]): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * Article schema for guide/blog pages
 * Helps Google understand content freshness and authorship
 */
export interface ArticleData {
  title: string;
  description: string;
  publishDate: string;
  modifiedDate?: string;
  authorName?: string;
  imageUrl?: string;
  url: string;
}

export function createArticleSchema(data: ArticleData): WithContext<Article> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.description,
    datePublished: data.publishDate,
    dateModified: data.modifiedDate || data.publishDate,
    author: {
      "@type": "Organization",
      name: data.authorName || "SheetMates",
    },
    publisher: {
      "@type": "Organization",
      name: "SheetMates",
      logo: {
        "@type": "ImageObject",
        url: "https://sheetmates.com/sheetmates_logo_full.png",
      },
    },
    ...(data.imageUrl && {
      image: {
        "@type": "ImageObject",
        url: data.imageUrl,
      },
    }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": data.url,
    },
  };
}

/**
 * Service schema for laser cutting service pages
 * Establishes what services SheetMates offers
 */
export function createServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Laser Cutting Service",
    provider: {
      "@type": "Organization",
      name: "SheetMates",
      url: "https://sheetmates.com",
    },
    areaServed: {
      "@type": "Place",
      name: "European Union",
    },
    description:
      "Precision laser cutting service using industrial buffer sheets. Upload DXF files for instant pricing and fast turnaround.",
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: "0.00",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        priceCurrency: "EUR",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: "1",
          unitCode: "PCE",
        },
      },
    },
  };
}

/**
 * Helper to inject schema into page head
 * Usage: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
 */
export function schemaToScript(
  schema:
    | WithContext<Organization>
    | WithContext<Product>
    | WithContext<BreadcrumbList>
    | WithContext<FAQPage>
    | WithContext<Article>
): string {
  return JSON.stringify(schema);
}
