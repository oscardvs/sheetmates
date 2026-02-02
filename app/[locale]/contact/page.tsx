"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  EnvelopeIcon,
  PaperPlaneTiltIcon,
  SpinnerGapIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";

const CONTACT_REASONS = [
  "general",
  "quote",
  "orderSupport",
  "technical",
  "other",
] as const;

type ContactReason = (typeof CONTACT_REASONS)[number];

interface FormData {
  reason: ContactReason;
  name: string;
  email: string;
  orderReference: string;
  message: string;
}

export default function ContactPage() {
  const t = useTranslations("contact");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    reason: "general",
    name: "",
    email: "",
    orderReference: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setIsSuccess(true);
      toast.success(t("success"));
    } catch {
      toast.error(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isSuccess) {
    return (
      <AuthProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex flex-1 items-center justify-center px-4">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-emerald-500/30 bg-emerald-500/10">
                <CheckCircleIcon className="h-8 w-8 text-emerald-500" weight="light" />
              </div>
              <h1 className="mb-2 font-mono text-2xl font-bold text-foreground">
                {t("successTitle")}
              </h1>
              <p className="mb-8 font-mono text-sm text-muted-foreground">
                {t("successMessage")}
              </p>
              <Button onClick={() => setIsSuccess(false)} variant="outline">
                {t("sendAnother")}
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    );
  }

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

          {/* Contact Form */}
          <section className="mx-auto max-w-2xl px-4 py-16">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Reason */}
              <div>
                <label
                  htmlFor="reason"
                  className="mb-2 block font-mono text-xs font-medium uppercase tracking-wider text-foreground"
                >
                  {t("fields.reason.label")}
                </label>
                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  {CONTACT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {t(`fields.reason.options.${reason}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block font-mono text-xs font-medium uppercase tracking-wider text-foreground"
                >
                  {t("fields.name.label")}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("fields.name.placeholder")}
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block font-mono text-xs font-medium uppercase tracking-wider text-foreground"
                >
                  {t("fields.email.label")}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("fields.email.placeholder")}
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Order Reference (shown for order support) */}
              {formData.reason === "orderSupport" && (
                <div>
                  <label
                    htmlFor="orderReference"
                    className="mb-2 block font-mono text-xs font-medium uppercase tracking-wider text-foreground"
                  >
                    {t("fields.orderReference.label")}
                  </label>
                  <input
                    type="text"
                    id="orderReference"
                    name="orderReference"
                    value={formData.orderReference}
                    onChange={handleChange}
                    placeholder={t("fields.orderReference.placeholder")}
                    className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block font-mono text-xs font-medium uppercase tracking-wider text-foreground"
                >
                  {t("fields.message.label")}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t("fields.message.placeholder")}
                  rows={6}
                  className="w-full resize-none border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary py-3 font-mono text-sm font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGapIcon className="mr-2 h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  <>
                    <PaperPlaneTiltIcon className="mr-2 h-4 w-4" />
                    {t("submit")}
                  </>
                )}
              </Button>
            </form>

            {/* Contact Info */}
            <div className="mt-12 border border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-primary" weight="light" />
                <div>
                  <p className="font-mono text-xs uppercase text-muted-foreground">
                    {t("directEmail")}
                  </p>
                  <a
                    href="mailto:contact@sheetmates.com"
                    className="font-mono text-sm text-foreground hover:text-primary"
                  >
                    contact@sheetmates.com
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}
