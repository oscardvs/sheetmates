import { useTranslations } from "next-intl";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function CookiesPage() {
  const t = useTranslations("legal.cookies");

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
              {/* What Are Cookies */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.what.title")}</h2>
                <p>{t("sections.what.content")}</p>
              </section>

              {/* Cookies We Use */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.used.title")}</h2>
                <p>{t("sections.used.intro")}</p>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full border border-border">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase">{t("table.cookie")}</th>
                        <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase">{t("table.purpose")}</th>
                        <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase">{t("table.type")}</th>
                        <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase">{t("table.duration")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="px-4 py-3 font-mono text-sm">firebase-auth</td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{t("cookies.auth.purpose")}</td>
                        <td className="px-4 py-3 font-mono text-sm">{t("cookies.auth.type")}</td>
                        <td className="px-4 py-3 font-mono text-sm">{t("cookies.auth.duration")}</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="px-4 py-3 font-mono text-sm">__stripe_mid</td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{t("cookies.stripeMid.purpose")}</td>
                        <td className="px-4 py-3 font-mono text-sm">{t("cookies.stripeMid.type")}</td>
                        <td className="px-4 py-3 font-mono text-sm">{t("cookies.stripeMid.duration")}</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="px-4 py-3 font-mono text-sm">__stripe_sid</td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{t("cookies.stripeSid.purpose")}</td>
                        <td className="px-4 py-3 font-mono text-sm">{t("cookies.stripeSid.type")}</td>
                        <td className="px-4 py-3 font-mono text-sm">{t("cookies.stripeSid.duration")}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono text-sm">cookie-consent</td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{t("cookies.consent.purpose")}</td>
                        <td className="px-4 py-3 font-mono text-sm">{t("cookies.consent.type")}</td>
                        <td className="px-4 py-3 font-mono text-sm">{t("cookies.consent.duration")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* No Tracking */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.noTracking.title")}</h2>
                <div className="border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="text-emerald-600 dark:text-emerald-400">{t("sections.noTracking.content")}</p>
                </div>
              </section>

              {/* Managing Cookies */}
              <section className="mb-12">
                <h2 className="mb-4 font-mono text-xl font-semibold">{t("sections.managing.title")}</h2>
                <p>{t("sections.managing.content")}</p>
                <p className="mt-4 text-muted-foreground">{t("sections.managing.warning")}</p>
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
