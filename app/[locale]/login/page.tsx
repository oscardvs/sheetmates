"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { login, loginWithGoogle } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { GoogleLogoIcon, ArrowRightIcon, TerminalIcon } from "@phosphor-icons/react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push("/upload");
    } catch {
      toast.error(t("loginButton") + " failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await loginWithGoogle();
      router.push("/upload");
    } catch {
      toast.error(t("googleLogin") + " failed");
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Left Panel - Branding */}
      <div className="relative hidden w-1/2 lg:block">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(63, 63, 70) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(63, 63, 70) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="font-mono text-2xl font-bold text-white">
            SheetMates
          </Link>
          <div>
            <div className="mb-4 inline-block border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
              <span className="font-mono text-xs text-emerald-400">AUTHENTICATION</span>
            </div>
            <h1 className="mb-4 font-mono text-4xl font-bold text-white">
              ACCESS YOUR<br />
              <span className="text-emerald-400">WORKSHOP</span>
            </h1>
            <p className="max-w-md font-mono text-sm text-zinc-400">
              Sign in to manage your parts, track orders, and access community sheets.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-600">
            <TerminalIcon className="h-4 w-4" />
            <span>SECURE • ENCRYPTED • EU-HOSTED</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center border-l border-zinc-800 bg-zinc-900/30 px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="font-mono text-xl font-bold text-white">
              SheetMates
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="font-mono text-2xl font-bold text-white">{t("loginTitle")}</h2>
            <p className="mt-2 font-mono text-sm text-zinc-500">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block font-mono text-xs uppercase tracking-wider text-zinc-400">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-zinc-700 bg-zinc-800/50 px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 transition-colors focus:border-emerald-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block font-mono text-xs uppercase tracking-wider text-zinc-400">
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-zinc-700 bg-zinc-800/50 px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 transition-colors focus:border-emerald-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 bg-emerald-500 px-4 py-3 font-mono text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-pulse">AUTHENTICATING...</span>
              ) : (
                <>
                  {t("loginButton")}
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="font-mono text-xs uppercase text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 border border-zinc-700 bg-zinc-800/30 px-4 py-3 font-mono text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            <GoogleLogoIcon className="h-5 w-5" weight="bold" />
            {t("googleLogin")}
          </button>

          <p className="mt-8 text-center font-mono text-sm text-zinc-500">
            {t("noAccount")}{" "}
            <Link href="/signup" className="text-emerald-400 transition-colors hover:text-emerald-300">
              {t("signupButton")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
