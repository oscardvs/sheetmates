import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getGuideBySlug, getGuideSlugs, mdxComponents } from "@/lib/mdx";
import { generateGuideMetadata } from "@/lib/seo/metadata";
import { createArticleSchema, createBreadcrumbSchema } from "@/lib/seo/schema";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { CalendarIcon, ClockIcon } from "@phosphor-icons/react/dist/ssr";

interface GuidePageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = getGuideBySlug(slug, locale);

  if (!guide) {
    return { title: "Guide Not Found" };
  }

  return generateGuideMetadata(
    guide.frontmatter.title,
    guide.frontmatter.description,
    slug,
    guide.frontmatter.keywords,
    locale
  );
}

// Generate static params for all guides
export async function generateStaticParams() {
  // Generate for default locale (en) - will be generated for other locales by Next.js
  const slugs = getGuideSlugs("en");

  return slugs.map((slug) => ({
    slug,
  }));
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { locale, slug } = await params;
  const guide = getGuideBySlug(slug, locale);

  if (!guide) {
    notFound();
  }

  const { frontmatter, content } = guide;

  // Generate JSON-LD schemas
  const articleSchema = createArticleSchema({
    title: frontmatter.title,
    description: frontmatter.description,
    publishDate: frontmatter.publishDate,
    modifiedDate: frontmatter.modifiedDate,
    authorName: frontmatter.author,
    url: `https://sheetmates.com/${locale}/guides/${slug}`,
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", path: `/${locale}` },
    { name: "Guides", path: `/${locale}/guides` },
    { name: frontmatter.title, path: `/${locale}/guides/${slug}` },
  ]);

  // Calculate reading time (rough estimate: 200 words per minute)
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />

        {/* JSON-LD Schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema),
          }}
        />

        {/* Article Header */}
        <article className="flex-1">
          <header className="border-b border-border bg-background">
            <div className="mx-auto max-w-4xl px-4 py-16">
              {frontmatter.category && (
                <div className="mb-4 inline-block border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-primary">
                  {frontmatter.category}
                </div>
              )}

              <h1 className="mb-4 font-mono text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {frontmatter.title}
              </h1>

              <p className="mb-6 font-mono text-lg text-muted-foreground">
                {frontmatter.description}
              </p>

              <div className="flex items-center gap-6 border-t border-border pt-4 font-mono text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} weight="light" />
                  <span>
                    {new Date(frontmatter.publishDate).toLocaleDateString(
                      locale,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon size={16} weight="light" />
                  <span>{readingTime} min read</span>
                </div>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="mx-auto max-w-4xl px-4 py-12">
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <MDXRemote
                source={content}
                components={mdxComponents}
                options={{
                  mdxOptions: {
                    rehypePlugins: [
                      rehypeHighlight,
                      rehypeSlug,
                      [
                        rehypeAutolinkHeadings,
                        {
                          behavior: "wrap",
                          properties: {
                            className: ["anchor"],
                          },
                        },
                      ],
                    ],
                  },
                }}
              />
            </div>
          </div>
        </article>
      </div>
    </AuthProvider>
  );
}
