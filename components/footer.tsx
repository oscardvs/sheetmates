import { Link } from "@/i18n/navigation";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p>&copy; {new Date().getFullYear()} SheetMates. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
        </nav>
      </div>
    </footer>
  );
}
