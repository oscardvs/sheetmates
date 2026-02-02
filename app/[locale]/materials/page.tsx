import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

// SEO metadata for materials hub
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePageMetadata({
    title: "Laser Cutting Materials - Steel, Aluminum, Stainless Steel & More",
    description:
      "Choose from steel, aluminum, stainless steel, and copper for precision laser cutting. Browse available materials, thicknesses, and get instant pricing. Industrial quality at maker-friendly prices.",
    keywords: [
      "laser cutting materials",
      "steel laser cutting",
      "aluminum laser cutting",
      "stainless steel cutting",
      "copper laser cutting",
      "sheet metal materials",
      "material selection laser cutting",
      "metal fabrication materials",
    ],
    canonical: `/${locale}/materials`,
    locale,
  });
}

export default function MaterialsPage() {

  const materials = [
    {
      id: "steel",
      name: "Steel (Mild Steel)",
      description: "Carbon steel sheets, excellent for structural parts and general fabrication. Cost-effective and widely available.",
      thicknesses: "0.5mm - 20mm",
      color: "zinc",
      available: true,
    },
    {
      id: "aluminum",
      name: "Aluminum",
      description: "Lightweight, corrosion-resistant metal ideal for aerospace, automotive, and consumer products.",
      thicknesses: "0.5mm - 25mm",
      color: "blue",
      available: true,
    },
    {
      id: "stainless",
      name: "Stainless Steel",
      description: "Corrosion-resistant steel for food-grade, medical, and outdoor applications. Premium finish quality.",
      thicknesses: "0.5mm - 20mm",
      color: "purple",
      available: true,
    },
    {
      id: "copper",
      name: "Copper",
      description: "Excellent electrical and thermal conductor. Ideal for electronics, heat exchangers, and decorative parts.",
      thicknesses: "0.5mm - 10mm",
      color: "orange",
      available: true,
    },
  ];

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
                Materials
              </span>
              <div className="h-px w-12 bg-primary" />
            </div>
            <h1 className="mb-6 text-center font-mono text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Laser Cutting Materials
            </h1>
            <p className="mx-auto max-w-2xl text-center font-mono text-lg text-muted-foreground">
              Industrial-grade materials from buffer sheet stock. Precision CNC
              laser cutting with fast turnaround and transparent pricing.
            </p>
          </div>
        </section>

        {/* Materials Grid */}
        <section className="flex-1 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="grid gap-6 md:grid-cols-2">
              {materials.map((material) => (
                <Link
                  key={material.id}
                  href={`/materials/${material.id}` as never}
                  className="group relative border border-border bg-card/50 p-8 transition-all hover:border-primary/50 hover:bg-card"
                >
                  <div className="absolute -top-3 left-6 bg-background px-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {material.available ? "Available" : "Coming Soon"}
                  </div>

                  <h2 className="mb-3 font-mono text-2xl font-bold text-foreground">
                    {material.name}
                  </h2>

                  <p className="mb-4 font-mono text-sm leading-relaxed text-muted-foreground">
                    {material.description}
                  </p>

                  <div className="mb-6 flex items-center gap-4 border-t border-border pt-4">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">
                        Thickness Range
                      </div>
                      <div className="font-mono text-sm font-semibold text-foreground">
                        {material.thicknesses}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-sm text-primary">
                    <span>View Details</span>
                    <ArrowRightIcon
                      className="transition-transform group-hover:translate-x-1"
                      size={16}
                      weight="bold"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border bg-background py-12">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h3 className="mb-4 font-mono text-2xl font-bold text-foreground">
              Ready to Start Your Project?
            </h3>
            <p className="mb-6 font-mono text-sm text-muted-foreground">
              Upload your DXF files and get instant pricing across all
              available materials.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 border border-primary bg-primary px-6 py-3 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Upload DXF Files
              <ArrowRightIcon size={16} weight="bold" />
            </Link>
          </div>
        </section>
      </div>
    </AuthProvider>
  );
}
