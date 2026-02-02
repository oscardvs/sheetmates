import { MetadataRoute } from "next";

/**
 * Robots.txt configuration for SheetMates
 * Controls which pages search engines can crawl
 */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/en/",
          "/fr/",
          "/cs/",
          "/sheets",
          "/materials",
          "/guides",
          "/faq",
          "/vs",
          "/tools",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/queue",
          "/queue/*",
          "/checkout",
          "/checkout/*",
          "/api",
          "/api/*",
          "/settings",
          "/settings/*",
          "/_next",
          "/*.json$",
          "/*?*", // Block URL parameters (optional, be careful with this)
        ],
      },
      {
        userAgent: "GPTBot", // OpenAI crawler
        disallow: ["/"], // Block AI scrapers from content (optional)
      },
      {
        userAgent: "CCBot", // Common Crawl
        disallow: ["/"], // Block AI scrapers (optional)
      },
    ],
    sitemap: "https://sheetmates.com/sitemap.xml",
  };
}
