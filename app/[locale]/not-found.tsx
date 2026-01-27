import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <h2 className="text-2xl font-semibold">{t("notFound")}</h2>
      <p className="text-muted-foreground">{t("notFoundDesc")}</p>
      <Button asChild>
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </div>
  );
}
