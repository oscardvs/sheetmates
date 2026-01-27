"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signup, loginWithGoogle } from "@/lib/firebase/auth";
import { createUserDoc } from "@/lib/firebase/db/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("signupTitle")}</CardTitle>
          <CardDescription>SheetMates</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : t("signupButton")}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
          >
            {t("googleLogin")}
          </Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-primary underline">
              {t("loginButton")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
