import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { GuideContent, FAQContent, GuideFrontmatter, FAQFrontmatter } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

/**
 * Get all guide slugs for a locale
 */
export function getGuideSlugs(locale: string): string[] {
  const guidesDir = path.join(CONTENT_DIR, locale, "guides");

  if (!fs.existsSync(guidesDir)) {
    return [];
  }

  return fs
    .readdirSync(guidesDir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/**
 * Get guide content by slug
 */
export function getGuideBySlug(
  slug: string,
  locale: string
): GuideContent | null {
  const filePath = path.join(CONTENT_DIR, locale, "guides", `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data as GuideFrontmatter,
    content,
  };
}

/**
 * Get all guides for a locale
 */
export function getAllGuides(locale: string): GuideContent[] {
  const slugs = getGuideSlugs(locale);
  return slugs
    .map((slug) => getGuideBySlug(slug, locale))
    .filter((guide): guide is GuideContent => guide !== null)
    .sort((a, b) => {
      // Sort by publish date (newest first)
      return (
        new Date(b.frontmatter.publishDate).getTime() -
        new Date(a.frontmatter.publishDate).getTime()
      );
    });
}

/**
 * Get all FAQ category/slug combinations for a locale
 */
export function getFAQSlugs(locale: string): Array<{ category: string; slug: string }> {
  const faqDir = path.join(CONTENT_DIR, locale, "faq");

  if (!fs.existsSync(faqDir)) {
    return [];
  }

  const results: Array<{ category: string; slug: string }> = [];

  // Read all files in faq directory (they're named category-slug.mdx)
  const files = fs.readdirSync(faqDir).filter((file) => file.endsWith(".mdx"));

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");
    // Extract category from frontmatter
    const filePath = path.join(faqDir, file);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);

    if (data.category) {
      results.push({
        category: data.category,
        slug,
      });
    }
  }

  return results;
}

/**
 * Get FAQ content by category and slug
 */
export function getFAQBySlug(
  category: string,
  slug: string,
  locale: string
): FAQContent | null {
  // FAQs are stored as category-slug.mdx
  const filePath = path.join(CONTENT_DIR, locale, "faq", `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  // Verify category matches
  if (data.category !== category) {
    return null;
  }

  return {
    slug,
    frontmatter: data as FAQFrontmatter,
    content,
  };
}

/**
 * Get all FAQs for a locale, optionally filtered by category
 */
export function getAllFAQs(
  locale: string,
  categoryFilter?: string
): FAQContent[] {
  const items = getFAQSlugs(locale);

  return items
    .filter((item) => !categoryFilter || item.category === categoryFilter)
    .map((item) => getFAQBySlug(item.category, item.slug, locale))
    .filter((faq): faq is FAQContent => faq !== null);
}
