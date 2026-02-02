import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except:
  // - API routes (/api/*)
  // - Next.js internals (_next/*, _vercel/*)
  // - Static files with extensions (*.png, *.svg, *.ico, etc.)
  // - SEO files (sitemap.xml, robots.txt)
  matcher: [
    "/",
    "/(en|fr|cs)/:path*",
    "/((?!api|_next|_vercel|sitemap\\.xml|robots\\.txt|.*\\..*).*)",
  ],
};
