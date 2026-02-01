import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LandingCanvas } from "@/components/landing-canvas";
import {
  Upload,
  GridFour,
  Scissors,
  CurrencyDollar,
  Recycle,
  Lightning,
} from "@phosphor-icons/react/dist/ssr";

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-zinc-950">
        <Navbar />

        {/* Interactive Canvas Hero */}
        <LandingCanvas />

        <div className="bg-background">
          {/* How It Works */}
          <section className="mx-auto max-w-5xl px-4 py-20">
            <h2 className="mb-12 text-center text-3xl font-bold">
              {t("howItWorks.title")}
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardHeader className="items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Upload className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-center">
                    {t("howItWorks.step1Title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  {t("howItWorks.step1Desc")}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <GridFour className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-center">
                    {t("howItWorks.step2Title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  {t("howItWorks.step2Desc")}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Scissors className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-center">
                    {t("howItWorks.step3Title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  {t("howItWorks.step3Desc")}
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Benefits */}
          <section className="mx-auto max-w-5xl px-4 py-20">
            <h2 className="mb-12 text-center text-3xl font-bold">
              {t("benefits.title")}
            </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center gap-3 text-center">
              <CurrencyDollar className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold">{t("benefits.cost")}</h3>
              <p className="text-muted-foreground">{t("benefits.costDesc")}</p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <Recycle className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold">{t("benefits.waste")}</h3>
              <p className="text-muted-foreground">{t("benefits.wasteDesc")}</p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <Lightning className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold">
                {t("benefits.turnaround")}
              </h3>
              <p className="text-muted-foreground">
                {t("benefits.turnaroundDesc")}
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* About */}
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="mb-6 text-3xl font-bold">{t("about.title")}</h2>
          <p className="text-lg text-muted-foreground">
            {t("about.description")}
          </p>
        </section>

        <Separator />

        {/* Footer CTA */}
        <section className="flex flex-col items-center gap-6 px-4 py-20 text-center">
          <h2 className="text-3xl font-bold">{t("footerCta.title")}</h2>
          <Button size="lg" asChild>
            <Link href="/signup">{t("footerCta.cta")}</Link>
          </Button>
        </section>

        <Footer />
        </div>
      </div>
    </AuthProvider>
  );
}
