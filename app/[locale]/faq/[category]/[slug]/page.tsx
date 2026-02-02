import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getFAQBySlug, getFAQSlugs, mdxComponents } from "@/lib/mdx";
import { generateFAQMetadata } from "@/lib/seo/metadata";
import { createFAQSchema, createBreadcrumbSchema } from "@/lib/seo/schema";

interface FAQPageProps {
  params: Promise<{
    locale: string;
    category: string;
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: FAQPageProps): Promise<Metadata> {
  const { locale, category, slug } = await params;
  const faq = getFAQBySlug(category, slug, locale);

  if (!faq) {
    return { title: "FAQ Not Found" };
  }

  return generateFAQMetadata(
    faq.frontmatter.question,
    faq.frontmatter.answer,
    category,
    slug,
    locale
  );
}

// Generate static params for all FAQs
export async function generateStaticParams() {
  // Generate for default locale (en) - will be generated for other locales by Next.js
  const faqs = getFAQSlugs("en");

  return faqs.map(({ category, slug }) => ({
    category,
    slug,
  }));
}

export default async function FAQPage({ params }: FAQPageProps) {
  const { locale, category, slug } = await params;
  const faq = getFAQBySlug(category, slug, locale);

  if (!faq) {
    notFound();
  }

  const { frontmatter, content } = faq;

  // Generate JSON-LD schemas
  const faqSchema = createFAQSchema([
    {
      question: frontmatter.question,
      answer: frontmatter.answer,
    },
  ]);

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", path: `/${locale}` },
    { name: "FAQ", path: `/${locale}/faq` },
    { name: category, path: `/${locale}/faq/${category}` },
    { name: frontmatter.question, path: `/${locale}/faq/${category}/${slug}` },
  ]);

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />

        {/* JSON-LD Schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema),
          }}
        />

        {/* FAQ Content */}
        <article className="flex-1">
          <header className="border-b border-border bg-background">
            <div className="mx-auto max-w-4xl px-4 py-16">
              <div className="mb-4 inline-block border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-primary">
                {category}
              </div>

              <h1 className="mb-4 font-mono text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {frontmatter.question}
              </h1>
            </div>
          </header>

          <div className="mx-auto max-w-4xl px-4 py-12">
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <MDXRemote source={content} components={mdxComponents} />
            </div>
          </div>
        </article>
      </div>
    </AuthProvider>
  );
}
