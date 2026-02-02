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
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Branding */}
      <div className="relative hidden w-1/2 lg:block">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--color-border) 1px, transparent 1px),
              linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="font-mono text-2xl font-bold text-foreground">
            SheetMates
          </Link>
          <div>
            <div className="mb-4 inline-block border border-primary/30 bg-primary/10 px-3 py-1">
              <span className="font-mono text-xs text-primary">NEW ACCOUNT</span>
            </div>
            <h1 className="mb-4 font-mono text-4xl font-bold text-foreground">
              JOIN THE<br />
              <span className="text-primary">COMMUNITY</span>
            </h1>
            <p className="max-w-md font-mono text-sm text-muted-foreground">
              Create your account to start uploading parts and sharing sheets with makers across Europe.
            </p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
                <div className="flex h-6 w-6 items-center justify-center border border-border text-primary">✓</div>
                <span>Upload unlimited DXF files</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
                <div className="flex h-6 w-6 items-center justify-center border border-border text-primary">✓</div>
                <span>Share sheet space & save costs</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
                <div className="flex h-6 w-6 items-center justify-center border border-border text-primary">✓</div>
                <span>Track orders in real-time</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>GDPR COMPLIANT • DATA HOSTED IN EU</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center border-l border-border bg-muted/30 px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="font-mono text-xl font-bold text-foreground">
              SheetMates
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="font-mono text-2xl font-bold text-foreground">{t("signupTitle")}</h2>
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              Fill in your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
                className="w-full border border-border bg-card/50 px-4 py-3 font-mono text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-border bg-card/50 px-4 py-3 font-mono text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
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
                className="w-full border border-border bg-card/50 px-4 py-3 font-mono text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
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
                className="w-full border border-border bg-card/50 px-4 py-3 font-mono text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-xs uppercase text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 border border-border bg-card/30 px-4 py-3 font-mono text-sm text-foreground transition-colors hover:border-primary hover:bg-card"
          >
            <GoogleLogoIcon className="h-5 w-5" weight="bold" />
            {t("googleLogin")}
          </button>

          <p className="mt-6 text-center font-mono text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-primary transition-colors hover:text-primary/80">
              {t("loginButton")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
