import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">
              SheetMates
            </span>
            <p className="font-mono text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} SheetMates. {t("rights")}
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            {/* Help */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("help")}
              </span>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/faq"
                  className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("faq")}
                </Link>
                <Link
                  href="/contact"
                  className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("contact")}
                </Link>
                <Link
                  href="/pricing"
                  className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("pricing")}
                </Link>
              </nav>
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("legal")}
              </span>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/privacy"
                  className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("privacy")}
                </Link>
                <Link
                  href="/terms"
                  className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("terms")}
                </Link>
                <Link
                  href="/cookies"
                  className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("cookies")}
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
