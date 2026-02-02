"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signup, loginWithGoogle } from "@/lib/firebase/auth";
import { createUserDoc } from "@/lib/firebase/db/users";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { GoogleLogoIcon, ArrowRightIcon, ShieldCheckIcon } from "@phosphor-icons/react";

export default function SignupPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const cred = await signup(email, password);
      await createUserDoc(cred.user.uid, {
        email: cred.user.email!,
        displayName: displayName || cred.user.email!,
      });
      router.push("/upload");
    } catch {
      toast.error(t("signupButton") + " failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      const cred = await loginWithGoogle();
      await createUserDoc(cred.user.uid, {
        email: cred.user.email!,
        displayName: cred.user.displayName || cred.user.email!,
      });
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
              <span className="font-mono text-xs text-emerald-400">NEW ACCOUNT</span>
            </div>
            <h1 className="mb-4 font-mono text-4xl font-bold text-white">
              JOIN THE<br />
              <span className="text-emerald-400">COMMUNITY</span>
            </h1>
            <p className="max-w-md font-mono text-sm text-zinc-400">
              Create your account to start uploading parts and sharing sheets with makers across Europe.
            </p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 font-mono text-sm text-zinc-500">
                <div className="flex h-6 w-6 items-center justify-center border border-zinc-700 text-emerald-400">✓</div>
                <span>Upload unlimited DXF files</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-sm text-zinc-500">
                <div className="flex h-6 w-6 items-center justify-center border border-zinc-700 text-emerald-400">✓</div>
                <span>Share sheet space & save costs</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-sm text-zinc-500">
                <div className="flex h-6 w-6 items-center justify-center border border-zinc-700 text-emerald-400">✓</div>
                <span>Track orders in real-time</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-600">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>GDPR COMPLIANT • DATA HOSTED IN EU</span>
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
            <h2 className="font-mono text-2xl font-bold text-white">{t("signupTitle")}</h2>
            <p className="mt-2 font-mono text-sm text-zinc-500">
              Fill in your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="mb-2 block font-mono text-xs uppercase tracking-wider text-zinc-400">
                Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
                className="w-full border border-zinc-700 bg-zinc-800/50 px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 transition-colors focus:border-emerald-500 focus:outline-none"
                placeholder="Your name"
              />
            </div>

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
                autoComplete="new-password"
                minLength={6}
                className="w-full border border-zinc-700 bg-zinc-800/50 px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 transition-colors focus:border-emerald-500 focus:outline-none"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block font-mono text-xs uppercase tracking-wider text-zinc-400">
                {t("confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
                className="w-full border border-zinc-700 bg-zinc-800/50 px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 transition-colors focus:border-emerald-500 focus:outline-none"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 bg-emerald-500 px-4 py-3 font-mono text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-pulse">CREATING ACCOUNT...</span>
              ) : (
                <>
                  {t("signupButton")}
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
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

          <p className="mt-6 text-center font-mono text-sm text-zinc-500">
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-emerald-400 transition-colors hover:text-emerald-300">
              {t("loginButton")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
