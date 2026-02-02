import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { getAllGuides } from "@/lib/mdx";
import { ArrowRightIcon, BookOpenIcon } from "@phosphor-icons/react/dist/ssr";

// SEO metadata for guides hub
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePageMetadata({
    title: "Laser Cutting Guides & Tutorials",
    description:
      "Comprehensive guides on DXF preparation, material selection, kerf compensation, and design for manufacturing. Learn how to optimize your parts for laser cutting.",
    keywords: [
      "laser cutting guides",
      "dxf tutorial",
      "laser cutting tips",
      "design for manufacturing",
      "kerf compensation guide",
      "material selection laser cutting",
    ],
    canonical: `/${locale}/guides`,
    locale,
  });
}

export default async function GuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const guides = getAllGuides(locale);

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-primary" />
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                Knowledge Base
              </span>
              <div className="h-px w-12 bg-primary" />
            </div>
            <h1 className="mb-6 text-center font-mono text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Laser Cutting Guides
            </h1>
            <p className="mx-auto max-w-2xl text-center font-mono text-lg text-muted-foreground">
              Learn everything you need to know about preparing files,
              selecting materials, and optimizing designs for laser cutting.
            </p>
          </div>
        </section>

        {/* Guides Grid */}
        <section className="flex-1 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16">
            {guides.length === 0 ? (
              <div className="rounded border border-border bg-card/50 p-12 text-center">
                <BookOpenIcon
                  className="mx-auto mb-4 text-muted-foreground"
                  size={48}
                  weight="light"
                />
                <p className="font-mono text-sm text-muted-foreground">
                  Guides coming soon...
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {guides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}` as never}
                    className="group relative border border-border bg-card/50 p-6 transition-all hover:border-primary/50 hover:bg-card"
                  >
                    <div className="absolute -top-3 left-6 bg-background px-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {guide.frontmatter.category || "Guide"}
                    </div>

                    <h2 className="mb-3 font-mono text-xl font-bold text-foreground">
                      {guide.frontmatter.title}
                    </h2>

                    <p className="mb-4 font-mono text-sm leading-relaxed text-muted-foreground">
                      {guide.frontmatter.description}
                    </p>

                    <div className="flex items-center gap-2 font-mono text-sm text-primary">
                      <span>Read Guide</span>
                      <ArrowRightIcon
                        className="transition-transform group-hover:translate-x-1"
                        size={16}
                        weight="bold"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AuthProvider>
  );
}
