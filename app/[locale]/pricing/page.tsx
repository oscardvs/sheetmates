import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/navbar";
import { defaultPricingConfig } from "@/lib/firebase/db/pricing-config";
import {
  CurrencyEurIcon,
  ScissorsIcon,
  SquareIcon,
  StackIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";

export default function PricingPage() {
  const t = useTranslations("pricing");
  const config = defaultPricingConfig;

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />

        {/* Hero */}
        <section className="relative border-b border-border">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--color-border) 1px, transparent 1px),
                linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 text-center">
            <div className="mb-4 inline-block border border-primary/30 bg-primary/10 px-3 py-1">
              <span className="font-mono text-xs text-primary">TRANSPARENT PRICING</span>
            </div>
            <h1 className="mb-4 font-mono text-4xl font-bold text-foreground md:text-5xl">
              {t("title")}
            </h1>
            <p className="mx-auto max-w-2xl font-mono text-sm text-muted-foreground">
              Pay only for what you use. No hidden fees. All prices shown exclude VAT.
            </p>
          </div>
        </section>

        {/* Base Rates */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-8 flex items-center gap-2">
              <div className="h-px w-8 bg-primary" />
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                BASE RATES
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
              <div className="border border-border bg-background p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center border border-border bg-card/50">
                  <SquareIcon className="h-5 w-5 text-primary" weight="light" />
                </div>
                <div className="font-mono text-xs uppercase text-muted-foreground">{t("perArea")}</div>
                <div className="mt-1 font-mono text-2xl font-bold text-foreground">
                  €{config.perCm2Rate.toFixed(3)}
                  <span className="text-sm text-muted-foreground">/cm²</span>
                </div>
              </div>

              <div className="border border-border bg-background p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center border border-border bg-card/50">
                  <ScissorsIcon className="h-5 w-5 text-primary" weight="light" />
                </div>
                <div className="font-mono text-xs uppercase text-muted-foreground">{t("perCut")}</div>
                <div className="mt-1 font-mono text-2xl font-bold text-foreground">
                  €{config.perMmCutRate.toFixed(3)}
                  <span className="text-sm text-muted-foreground">/mm</span>
                </div>
              </div>

              <div className="border border-border bg-background p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center border border-border bg-card/50">
                  <CurrencyEurIcon className="h-5 w-5 text-primary" weight="light" />
                </div>
                <div className="font-mono text-xs uppercase text-muted-foreground">{t("minimum")}</div>
                <div className="mt-1 font-mono text-2xl font-bold text-foreground">
                  €{config.minimumPrice.toFixed(2)}
                </div>
              </div>

              <div className="border border-border bg-background p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center border border-border bg-card/50">
                  <StackIcon className="h-5 w-5 text-primary" weight="light" />
                </div>
                <div className="font-mono text-xs uppercase text-muted-foreground">{t("vat")}</div>
                <div className="mt-1 font-mono text-2xl font-bold text-foreground">
                  {(config.vatRate * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Material Multipliers */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-8 flex items-center gap-2">
              <div className="h-px w-8 bg-border" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {t("material")} MULTIPLIERS
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(config.materialMultipliers).map(([mat, mult]) => (
                <div key={mat} className="flex items-center justify-between border border-border bg-muted/30 px-4 py-3">
                  <span className="font-mono text-sm capitalize text-foreground">{mat}</span>
                  <span className="font-mono text-lg font-bold text-primary">
                    ×{(mult as number).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Thickness Multipliers */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-8 flex items-center gap-2">
              <div className="h-px w-8 bg-border" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {t("thickness")} MULTIPLIERS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {t("thickness")} (mm)
                    </th>
                    <th className="py-3 text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Multiplier
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(config.thicknessMultipliers).map(([thick, mult]) => (
                    <tr key={thick} className="border-b border-border/50">
                      <td className="py-3 font-mono text-sm text-foreground">{thick} mm</td>
                      <td className="py-3 text-right font-mono text-lg font-bold text-primary">
                        ×{(mult as number).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Formula */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-8 flex items-center gap-2">
              <div className="h-px w-8 bg-border" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                PRICING FORMULA
              </span>
            </div>

            <div className="border border-border bg-muted/50 p-6 md:p-8">
              <div className="overflow-x-auto">
                <code className="block whitespace-nowrap font-mono text-sm text-foreground md:text-base">
                  <span className="text-primary">Price</span> = (
                  <span className="text-muted-foreground">Area</span> × perCm²Rate +
                  <span className="text-muted-foreground"> CutLength</span> × perMmRate) ×
                  <span className="text-muted-foreground"> MaterialMult</span> ×
                  <span className="text-muted-foreground"> ThicknessMult</span>
                </code>
              </div>
              <p className="mt-4 font-mono text-xs text-muted-foreground">
                Final price includes {(config.vatRate * 100).toFixed(0)}% VAT for EU customers.
                Minimum order value: €{config.minimumPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center">
            <h2 className="mb-4 font-mono text-2xl font-bold text-foreground">
              Ready to calculate your price?
            </h2>
            <p className="mb-8 font-mono text-sm text-muted-foreground">
              Upload your DXF files and get an instant quote
            </p>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 bg-primary px-8 py-4 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-background py-8">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="font-mono text-xs text-muted-foreground">
                © 2026 SheetMates. Belgian-incorporated. All data hosted in EU (europe-west1).
              </div>
              <div className="flex gap-6">
                <Link href="/" className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground">
                  Home
                </Link>
                <Link href="/login" className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
