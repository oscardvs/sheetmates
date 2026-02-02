"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  RocketLaunchIcon,
  CurrencyEurIcon,
  CubeIcon,
  FileCodeIcon,
  TruckIcon,
  LifebuoyIcon,
} from "@phosphor-icons/react";

const CATEGORY_ICONS = {
  gettingStarted: RocketLaunchIcon,
  pricing: CurrencyEurIcon,
  materials: CubeIcon,
  dxfBestPractices: FileCodeIcon,
  delivery: TruckIcon,
  support: LifebuoyIcon,
} as const;

const CATEGORIES = [
  "gettingStarted",
  "pricing",
  "materials",
  "dxfBestPractices",
  "delivery",
  "support",
] as const;

export default function FaqPage() {
  const t = useTranslations("faq");

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />

        <main className="flex-1">
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
            <div className="relative mx-auto max-w-4xl px-4 py-16 text-center">
              <div className="mb-4 inline-block border border-primary/30 bg-primary/10 px-3 py-1">
                <span className="font-mono text-xs text-primary">{t("badge")}</span>
              </div>
              <h1 className="mb-4 font-mono text-3xl font-bold text-foreground md:text-4xl">
                {t("title")}
              </h1>
              <p className="mx-auto max-w-2xl font-mono text-sm text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
          </section>

          {/* FAQ Content */}
          <section className="mx-auto max-w-4xl px-4 py-16">
            <div className="space-y-12">
              {CATEGORIES.map((categoryKey) => {
                const Icon = CATEGORY_ICONS[categoryKey];
                const items = t.raw(`categories.${categoryKey}.items`) as Array<{
                  question: string;
                  answer: string;
                }>;

                return (
                  <div key={categoryKey}>
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center border border-border bg-muted/50">
                        <Icon className="h-5 w-5 text-primary" weight="light" />
                      </div>
                      <h2 className="font-mono text-lg font-semibold text-foreground">
                        {t(`categories.${categoryKey}.title`)}
                      </h2>
                    </div>

                    <Accordion type="single" collapsible className="border border-border">
                      {items.map((item, index) => (
                        <AccordionItem
                          key={index}
                          value={`${categoryKey}-${index}`}
                          className="border-b border-border last:border-b-0 px-4"
                        >
                          <AccordionTrigger className="text-left font-mono text-sm font-medium text-foreground hover:text-primary">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="font-mono text-sm text-muted-foreground">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                );
              })}
            </div>

            {/* Contact CTA */}
            <div className="mt-16 border border-border bg-muted/30 p-8 text-center">
              <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
                {t("cta.title")}
              </h3>
              <p className="mb-6 font-mono text-sm text-muted-foreground">
                {t("cta.subtitle")}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-primary px-6 py-3 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("cta.button")}
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}
