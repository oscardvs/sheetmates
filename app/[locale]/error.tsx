"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold">{t("serverError")}</h1>
      <p className="text-muted-foreground">{t("serverErrorDesc")}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
