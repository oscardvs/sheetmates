import { useTranslations } from "next-intl";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function TermsPage() {
  const t = useTranslations("legal.terms");

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />

        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <div className="mb-4 inline-block border border-primary/30 bg-primary/10 px-3 py-1">
              <span className="font-mono text-xs text-primary">{t("badge")}</span>
            </div>
            <h1 className="mb-8 font-mono text-3xl font-bold text-foreground md:text-4xl">
              {t("title")}
            </h1>
            <p className="mb-8 font-mono text-xs text-muted-foreground">
              {t("lastUpdated")}
            </p>

            <div className="prose prose-zinc dark:prose-invert prose-headings:font-mono prose-p:font-mono prose-p:text-sm prose-li:font-mono prose-li:text-sm max-w-none">
              {/* Introduction */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.intro.title")}</h2>
                <p>{t("sections.intro.content")}</p>
              </section>

              {/* Service Description */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.service.title")}</h2>
                <p>{t("sections.service.content")}</p>
                <ul className="mt-4 list-disc pl-6">
                  <li>{t("sections.service.features.upload")}</li>
                  <li>{t("sections.service.features.nesting")}</li>
                  <li>{t("sections.service.features.cutting")}</li>
                  <li>{t("sections.service.features.delivery")}</li>
                </ul>
              </section>

              {/* Account Registration */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.account.title")}</h2>
                <p>{t("sections.account.content")}</p>
              </section>

              {/* Orders & Payments */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.orders.title")}</h2>
                <p>{t("sections.orders.content")}</p>
                <ul className="mt-4 list-disc pl-6">
                  <li>{t("sections.orders.points.pricing")}</li>
                  <li>{t("sections.orders.points.payment")}</li>
                  <li>{t("sections.orders.points.confirmation")}</li>
                  <li>{t("sections.orders.points.vat")}</li>
                </ul>
              </section>

              {/* Production & Delivery */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.production.title")}</h2>
                <p>{t("sections.production.content")}</p>
              </section>

              {/* Quality & Returns */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.quality.title")}</h2>
                <p>{t("sections.quality.content")}</p>
                <ul className="mt-4 list-disc pl-6">
                  <li>{t("sections.quality.points.dfm")}</li>
                  <li>{t("sections.quality.points.defects")}</li>
                  <li>{t("sections.quality.points.claims")}</li>
                </ul>
              </section>

              {/* User Obligations */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.obligations.title")}</h2>
                <ul className="list-disc pl-6">
                  <li>{t("sections.obligations.points.accurate")}</li>
                  <li>{t("sections.obligations.points.legal")}</li>
                  <li>{t("sections.obligations.points.ip")}</li>
                  <li>{t("sections.obligations.points.prohibited")}</li>
                </ul>
              </section>

              {/* Intellectual Property */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.ip.title")}</h2>
                <p>{t("sections.ip.content")}</p>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.liability.title")}</h2>
                <p>{t("sections.liability.content")}</p>
              </section>

              {/* Governing Law */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.law.title")}</h2>
                <p>{t("sections.law.content")}</p>
              </section>

              {/* Changes */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.changes.title")}</h2>
                <p>{t("sections.changes.content")}</p>
              </section>

              {/* Contact */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.contact.title")}</h2>
                <p>{t("sections.contact.content")}</p>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}
