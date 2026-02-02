import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LandingCanvasStatic } from "@/components/landing-canvas-static";
import { LandingCanvasWrapper } from "@/components/landing-canvas-wrapper";
import { LandingFooterLinks } from "@/components/landing-footer-links";
import { LandingCta } from "@/components/landing-cta";
import { generatePageMetadata } from "@/lib/seo/metadata";
import {
  UploadIcon,
  GridFourIcon,
  ScissorsIcon,
  CurrencyDollarIcon,
  RecycleIcon,
  LightningIcon,
  FactoryIcon,
  UsersIcon,
  CertificateIcon,
} from "@phosphor-icons/react/dist/ssr";

// SEO metadata for landing page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePageMetadata({
    title: "SheetMates - Community-Driven Laser Cutting Platform",
    description:
      "Transform industrial buffer sheets into precision laser-cut parts. Upload DXF files, get instant pricing, and access EU-based CNC manufacturing at maker-friendly prices. No minimums, fast turnaround.",
    keywords: [
      "laser cutting service",
      "sheet metal fabrication",
      "buffer sheets",
      "dxf laser cutting",
      "affordable laser cutting",
      "CNC manufacturing Europe",
      "laser cutting Belgium",
      "prototype fabrication",
      "small quantity laser cutting",
      "maker fabrication",
    ],
    canonical: `/${locale}`,
    locale,
  });
}

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />

        {/* Canvas Hero with Progressive Enhancement */}
        {/* Static version renders immediately for fast LCP */}
        <div className="relative">
          <LandingCanvasStatic />
          {/* Interactive version loads after hydration, replaces static */}
          <div className="absolute inset-0">
            <LandingCanvasWrapper />
          </div>
        </div>

        {/* How It Works */}
        <section className="relative border-t border-border bg-background">
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-10 dark:opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--color-border) 1px, transparent 1px),
                linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-4 py-20">
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-primary" />
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                {t("badges.process")}
              </span>
              <div className="h-px w-12 bg-primary" />
            </div>
            <h2 className="mb-16 text-center font-mono text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("howItWorks.title")}
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="group relative border border-border bg-card/50 p-6 transition-colors hover:border-primary/50">
                <div className="absolute -top-3 left-6 bg-background px-2 font-mono text-xs text-muted-foreground">
                  01
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center border border-primary/30 bg-primary/10">
                  <UploadIcon className="h-6 w-6 text-primary" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
                  {t("howItWorks.step1Title")}
                </h3>
                <p className="font-mono text-sm leading-relaxed text-muted-foreground">
                  {t("howItWorks.step1Desc")}
                </p>
              </div>

              {/* Step 2 */}
              <div className="group relative border border-border bg-card/50 p-6 transition-colors hover:border-primary/50">
                <div className="absolute -top-3 left-6 bg-background px-2 font-mono text-xs text-muted-foreground">
                  02
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center border border-primary/30 bg-primary/10">
                  <GridFourIcon className="h-6 w-6 text-primary" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
                  {t("howItWorks.step2Title")}
                </h3>
                <p className="font-mono text-sm leading-relaxed text-muted-foreground">
                  {t("howItWorks.step2Desc")}
                </p>
              </div>

              {/* Step 3 */}
              <div className="group relative border border-border bg-card/50 p-6 transition-colors hover:border-primary/50">
                <div className="absolute -top-3 left-6 bg-background px-2 font-mono text-xs text-muted-foreground">
                  03
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center border border-primary/30 bg-primary/10">
                  <ScissorsIcon className="h-6 w-6 text-primary" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
                  {t("howItWorks.step3Title")}
                </h3>
                <p className="font-mono text-sm leading-relaxed text-muted-foreground">
                  {t("howItWorks.step3Desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="relative border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-border" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {t("badges.advantages")}
              </span>
              <div className="h-px w-12 bg-border" />
            </div>
            <h2 className="mb-16 text-center font-mono text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("benefits.title")}
            </h2>

            <div className="grid gap-12 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-border bg-card/50">
                  <CurrencyDollarIcon className="h-8 w-8 text-primary" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
                  {t("benefits.cost")}
                </h3>
                <p className="font-mono text-sm text-muted-foreground">
                  {t("benefits.costDesc")}
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-border bg-card/50">
                  <RecycleIcon className="h-8 w-8 text-primary" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
                  {t("benefits.waste")}
                </h3>
                <p className="font-mono text-sm text-muted-foreground">
                  {t("benefits.wasteDesc")}
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-border bg-card/50">
                  <LightningIcon className="h-8 w-8 text-primary" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
                  {t("benefits.turnaround")}
                </h3>
                <p className="font-mono text-sm text-muted-foreground">
                  {t("benefits.turnaroundDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats/Trust Section */}
        <section className="border-t border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-foreground">3000</div>
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t("stats.sheetWidth")}</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-foreground">0.1</div>
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t("stats.precision")}</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-foreground">85%</div>
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t("stats.utilization")}</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-foreground">EU</div>
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t("stats.manufactured")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* About Tech-Centrum */}
        <section className="relative border-t border-border bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <div className="mb-6 flex items-center justify-center gap-4">
              <FactoryIcon className="h-8 w-8 text-muted-foreground" weight="light" />
              <UsersIcon className="h-8 w-8 text-muted-foreground" weight="light" />
              <CertificateIcon className="h-8 w-8 text-muted-foreground" weight="light" />
            </div>
            <h2 className="mb-6 font-mono text-2xl font-bold text-foreground md:text-3xl">
              {t("about.title")}
            </h2>
            <p className="mx-auto max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
              {t("about.description")}
            </p>
            <div className="mt-8 inline-block border border-border bg-card/30 px-4 py-2">
              <span className="font-mono text-xs text-muted-foreground">
                {t("equipment")}
              </span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t border-border bg-background">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--color-primary) 1px, transparent 1px),
                linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          <LandingCta />
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-background py-8">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="font-mono text-xs text-muted-foreground">
                {t("footer.copyright")}
              </div>
              <LandingFooterLinks />
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
