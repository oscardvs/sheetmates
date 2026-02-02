import { MetadataRoute } from "next";

/**
 * Dynamic sitemap generation for SheetMates
 * Auto-discovers all public routes and includes locale variants
 */

const BASE_URL = "https://sheetmates.com";
const LOCALES = ["en", "fr", "cs"] as const;

interface SitemapEntry {
  path: string;
  priority: number;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
}

// Static routes with their SEO priorities
const STATIC_ROUTES: SitemapEntry[] = [
  // Core pages
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/sheets", priority: 0.9, changeFrequency: "daily" },
  { path: "/upload", priority: 0.8, changeFrequency: "weekly" },

  // Material pages (transactional, high priority)
  { path: "/materials", priority: 0.9, changeFrequency: "weekly" },
  { path: "/materials/steel", priority: 0.8, changeFrequency: "weekly" },
  { path: "/materials/aluminum", priority: 0.8, changeFrequency: "weekly" },
  { path: "/materials/stainless", priority: 0.8, changeFrequency: "weekly" },
  { path: "/materials/copper", priority: 0.8, changeFrequency: "weekly" },

  // Content pages (educational, SEO-focused)
  { path: "/guides", priority: 0.8, changeFrequency: "weekly" },
  { path: "/guides/dxf-laser-cutting-complete-guide", priority: 0.7, changeFrequency: "monthly" },
  { path: "/guides/kerf-compensation-explained", priority: 0.7, changeFrequency: "monthly" },
  { path: "/guides/minimum-hole-size-laser-cutting", priority: 0.7, changeFrequency: "monthly" },

  // Auth pages (lower priority, less frequent changes)
  { path: "/login", priority: 0.3, changeFrequency: "monthly" },
  { path: "/signup", priority: 0.3, changeFrequency: "monthly" },
];

// Routes to exclude from sitemap (private or not SEO-relevant)
const EXCLUDED_ROUTES = [
  "/admin",
  "/queue",
  "/checkout",
  "/api",
  "/settings",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Generate entries for each locale
  for (const locale of LOCALES) {
    for (const route of STATIC_ROUTES) {
      const url = `${BASE_URL}/${locale}${route.path === "/" ? "" : route.path}`;

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        // Add alternate language versions
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [
              l,
              `${BASE_URL}/${l}${route.path === "/" ? "" : route.path}`,
            ])
          ),
        },
      });
    }
  }

  // TODO: Add dynamic routes when needed
  // - Individual sheet pages: /sheets/[id]
  // - Material thickness pages: /materials/[material]/[thickness]
  // - Guide pages: /guides/[slug]
  // - FAQ pages: /faq/[category]/[slug]
  // - Comparison pages: /vs/[competitor]
  //
  // Example for dynamic sheets:
  // const sheets = await getAllSheets();
  // const activeSheets = sheets.filter(s => s.status === "open");
  // for (const sheet of activeSheets) {
  //   entries.push({
  //     url: `${BASE_URL}/en/sheets/${sheet.id}`,
  //     lastModified: new Date(),
  //     priority: 0.6,
  //     changeFrequency: "daily",
  //   });
  // }

  return entries;
}
