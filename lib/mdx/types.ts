/**
 * MDX Content Types
 */

export interface GuideFrontmatter {
  title: string;
  description: string;
  keywords: string[];
  publishDate: string;
  modifiedDate?: string;
  category?: string;
  author?: string;
}

export interface FAQFrontmatter {
  question: string;
  answer: string;
  category: string;
  keywords?: string[];
  publishDate: string;
}

export interface GuideContent {
  slug: string;
  frontmatter: GuideFrontmatter;
  content: string;
}

export interface FAQContent {
  slug: string;
  frontmatter: FAQFrontmatter;
  content: string;
}
