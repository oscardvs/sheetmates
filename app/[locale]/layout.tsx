import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { SITE_CONFIG, generatePageMetadata } from "@/lib/seo/metadata";
import { createOrganizationSchema } from "@/lib/seo/schema";
import "../globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate metadata with proper SEO configuration
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePageMetadata({
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    keywords: SITE_CONFIG.keywords,
    locale,
  });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  // Generate organization schema for SEO
  const organizationSchema = createOrganizationSchema();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Preconnect to critical origins for faster resource loading */}
        <link rel="preconnect" href="https://sheetmates.firebaseapp.com" />
        <link rel="preconnect" href="https://apis.google.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* JSON-LD Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body
        className={`${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>
              {children}
              <Toaster />
              <CookieConsent />
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
