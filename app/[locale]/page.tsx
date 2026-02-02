import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LandingCanvas } from "@/components/landing-canvas";
import {
  UploadIcon,
  GridFourIcon,
  ScissorsIcon,
  CurrencyDollarIcon,
  RecycleIcon,
  LightningIcon,
  ArrowRightIcon,
  FactoryIcon,
  UsersIcon,
  CertificateIcon,
} from "@phosphor-icons/react/dist/ssr";

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-zinc-950">
        <Navbar />

        {/* Interactive Canvas Hero */}
        <LandingCanvas />

        {/* How It Works */}
        <section className="relative border-t border-zinc-800 bg-zinc-950">
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgb(63, 63, 70) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(63, 63, 70) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-4 py-20">
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-emerald-500" />
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">
                PROCESS
              </span>
              <div className="h-px w-12 bg-emerald-500" />
            </div>
            <h2 className="mb-16 text-center font-mono text-3xl font-bold tracking-tight text-white md:text-4xl">
              {t("howItWorks.title")}
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="group relative border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-emerald-500/50">
                <div className="absolute -top-3 left-6 bg-zinc-950 px-2 font-mono text-xs text-zinc-500">
                  01
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center border border-emerald-500/30 bg-emerald-500/10">
                  <UploadIcon className="h-6 w-6 text-emerald-400" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-white">
                  {t("howItWorks.step1Title")}
                </h3>
                <p className="font-mono text-sm leading-relaxed text-zinc-400">
                  {t("howItWorks.step1Desc")}
                </p>
              </div>

              {/* Step 2 */}
              <div className="group relative border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-emerald-500/50">
                <div className="absolute -top-3 left-6 bg-zinc-950 px-2 font-mono text-xs text-zinc-500">
                  02
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center border border-emerald-500/30 bg-emerald-500/10">
                  <GridFourIcon className="h-6 w-6 text-emerald-400" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-white">
                  {t("howItWorks.step2Title")}
                </h3>
                <p className="font-mono text-sm leading-relaxed text-zinc-400">
                  {t("howItWorks.step2Desc")}
                </p>
              </div>

              {/* Step 3 */}
              <div className="group relative border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-emerald-500/50">
                <div className="absolute -top-3 left-6 bg-zinc-950 px-2 font-mono text-xs text-zinc-500">
                  03
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center border border-emerald-500/30 bg-emerald-500/10">
                  <ScissorsIcon className="h-6 w-6 text-emerald-400" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-white">
                  {t("howItWorks.step3Title")}
                </h3>
                <p className="font-mono text-sm leading-relaxed text-zinc-400">
                  {t("howItWorks.step3Desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="relative border-t border-zinc-800 bg-zinc-900/30">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-zinc-700" />
              <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                ADVANTAGES
              </span>
              <div className="h-px w-12 bg-zinc-700" />
            </div>
            <h2 className="mb-16 text-center font-mono text-3xl font-bold tracking-tight text-white md:text-4xl">
              {t("benefits.title")}
            </h2>

            <div className="grid gap-12 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-zinc-700 bg-zinc-800/50">
                  <CurrencyDollarIcon className="h-8 w-8 text-emerald-400" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-white">
                  {t("benefits.cost")}
                </h3>
                <p className="font-mono text-sm text-zinc-400">
                  {t("benefits.costDesc")}
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-zinc-700 bg-zinc-800/50">
                  <RecycleIcon className="h-8 w-8 text-emerald-400" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-white">
                  {t("benefits.waste")}
                </h3>
                <p className="font-mono text-sm text-zinc-400">
                  {t("benefits.wasteDesc")}
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-zinc-700 bg-zinc-800/50">
                  <LightningIcon className="h-8 w-8 text-emerald-400" weight="light" />
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-white">
                  {t("benefits.turnaround")}
                </h3>
                <p className="font-mono text-sm text-zinc-400">
                  {t("benefits.turnaroundDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats/Trust Section */}
        <section className="border-t border-zinc-800 bg-zinc-950">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-emerald-400">3000</div>
                <div className="font-mono text-xs uppercase tracking-wider text-zinc-500">mm sheet width</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-emerald-400">0.1</div>
                <div className="font-mono text-xs uppercase tracking-wider text-zinc-500">mm precision</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-emerald-400">85%</div>
                <div className="font-mono text-xs uppercase tracking-wider text-zinc-500">target utilization</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-emerald-400">EU</div>
                <div className="font-mono text-xs uppercase tracking-wider text-zinc-500">manufactured</div>
              </div>
            </div>
          </div>
        </section>

        {/* About Tech-Centrum */}
        <section className="relative border-t border-zinc-800 bg-zinc-900/30">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <div className="mb-6 flex items-center justify-center gap-4">
              <FactoryIcon className="h-8 w-8 text-zinc-600" weight="light" />
              <UsersIcon className="h-8 w-8 text-zinc-600" weight="light" />
              <CertificateIcon className="h-8 w-8 text-zinc-600" weight="light" />
            </div>
            <h2 className="mb-6 font-mono text-2xl font-bold text-white md:text-3xl">
              {t("about.title")}
            </h2>
            <p className="mx-auto max-w-2xl font-mono text-sm leading-relaxed text-zinc-400">
              {t("about.description")}
            </p>
            <div className="mt-8 inline-block border border-zinc-700 bg-zinc-800/30 px-4 py-2">
              <span className="font-mono text-xs text-zinc-500">
                POWERED BY TRUMPF TRULASER 3030 FIBER
              </span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t border-zinc-800 bg-zinc-950">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgb(16, 185, 129) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(16, 185, 129) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative mx-auto max-w-4xl px-4 py-20 text-center">
            <h2 className="mb-4 font-mono text-3xl font-bold text-white md:text-4xl">
              {t("footerCta.title")}
            </h2>
            <p className="mb-8 font-mono text-sm text-zinc-400">
              Join the community. Share the sheet. Save on every cut.
            </p>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 bg-emerald-500 px-8 py-4 font-mono text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
            >
              {t("footerCta.cta")}
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800 bg-zinc-950 py-8">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="font-mono text-xs text-zinc-600">
                © 2026 SheetMates. Belgian-incorporated. All data hosted in EU (europe-west1).
              </div>
              <div className="flex gap-6">
                <Link href="/pricing" className="font-mono text-xs text-zinc-500 transition-colors hover:text-white">
                  Pricing
                </Link>
                <Link href="/login" className="font-mono text-xs text-zinc-500 transition-colors hover:text-white">
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
