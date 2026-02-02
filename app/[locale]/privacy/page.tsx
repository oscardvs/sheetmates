import { useTranslations } from "next-intl";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function PrivacyPage() {
  const t = useTranslations("legal.privacy");

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

              {/* Data Controller */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.controller.title")}</h2>
                <p>{t("sections.controller.content")}</p>
                <div className="mt-4 border border-border bg-muted/30 p-4 font-mono text-sm">
                  <p>SheetMates</p>
                  <p>Tech-Centrum</p>
                  <p>Belgium</p>
                  <p>contact@sheetmates.com</p>
                </div>
              </section>

              {/* Data We Collect */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.dataCollected.title")}</h2>
                <p>{t("sections.dataCollected.intro")}</p>
                <ul className="mt-4 list-disc pl-6">
                  <li><strong>{t("sections.dataCollected.account.title")}</strong>: {t("sections.dataCollected.account.content")}</li>
                  <li><strong>{t("sections.dataCollected.order.title")}</strong>: {t("sections.dataCollected.order.content")}</li>
                  <li><strong>{t("sections.dataCollected.technical.title")}</strong>: {t("sections.dataCollected.technical.content")}</li>
                  <li><strong>{t("sections.dataCollected.files.title")}</strong>: {t("sections.dataCollected.files.content")}</li>
                </ul>
              </section>

              {/* How We Use Data */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.dataUse.title")}</h2>
                <ul className="list-disc pl-6">
                  <li>{t("sections.dataUse.purposes.orders")}</li>
                  <li>{t("sections.dataUse.purposes.communication")}</li>
                  <li>{t("sections.dataUse.purposes.improvement")}</li>
                  <li>{t("sections.dataUse.purposes.legal")}</li>
                </ul>
              </section>

              {/* Data Processors */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.processors.title")}</h2>
                <p>{t("sections.processors.intro")}</p>
                <div className="mt-4 space-y-4">
                  <div className="border border-border p-4">
                    <p className="font-semibold">Firebase (Google Ireland Limited)</p>
                    <p className="text-muted-foreground">{t("sections.processors.firebase")}</p>
                  </div>
                  <div className="border border-border p-4">
                    <p className="font-semibold">Stripe Payments Europe Limited</p>
                    <p className="text-muted-foreground">{t("sections.processors.stripe")}</p>
                  </div>
                </div>
              </section>

              {/* Data Storage */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.storage.title")}</h2>
                <p>{t("sections.storage.content")}</p>
              </section>

              {/* GDPR Rights */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.rights.title")}</h2>
                <p>{t("sections.rights.intro")}</p>
                <ul className="mt-4 list-disc pl-6">
                  <li><strong>{t("sections.rights.access.title")}</strong>: {t("sections.rights.access.content")}</li>
                  <li><strong>{t("sections.rights.rectification.title")}</strong>: {t("sections.rights.rectification.content")}</li>
                  <li><strong>{t("sections.rights.erasure.title")}</strong>: {t("sections.rights.erasure.content")}</li>
                  <li><strong>{t("sections.rights.portability.title")}</strong>: {t("sections.rights.portability.content")}</li>
                  <li><strong>{t("sections.rights.object.title")}</strong>: {t("sections.rights.object.content")}</li>
                </ul>
                <p className="mt-4">{t("sections.rights.exercise")}</p>
              </section>

              {/* Data Retention */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.retention.title")}</h2>
                <ul className="list-disc pl-6">
                  <li>{t("sections.retention.account")}</li>
                  <li>{t("sections.retention.orders")}</li>
                  <li>{t("sections.retention.guest")}</li>
                </ul>
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
