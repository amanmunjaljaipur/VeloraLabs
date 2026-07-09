import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { AdminSiteChrome } from "@/components/admin/AdminSiteChrome";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ChatWidgetLoader } from "@/components/chat/ChatWidgetLoader";
import { RolePendingNotice } from "@/components/auth/RolePendingNotice";
import { LegalAcceptanceGateLoader } from "@/components/legal/LegalAcceptanceGateLoader";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import { WebSiteJsonLd } from "@/components/seo/WebSiteJsonLd";
import { getSiteConfig } from "@/lib/content";
import { buildFooterLinkGroups, getHeaderNavLinks } from "@/lib/site-sitemap";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

function buildSiteVerification(): Metadata["verification"] | undefined {
  const verification: NonNullable<Metadata["verification"]> = {};
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const bing = process.env.BING_SITE_VERIFICATION?.trim();

  if (google) verification.google = google;
  if (bing) {
    verification.other = { ...(verification.other ?? {}), "msvalidate.01": bing };
  }

  return Object.keys(verification).length > 0 ? verification : undefined;
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const siteVerification = buildSiteVerification();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Verlin Labs — AI Training & Mental Models for Students, Engineers & PMs",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Verlin Labs — clarity-first AI training in India. Free 2-hour session, mental models, and live programs for students, engineers, and product managers.",
  keywords: [
    "AI training India",
    "AI course India",
    "AI classes for students",
    "AI training for engineers",
    "AI training for product managers",
    "mental models AI",
    "LLM course India",
    "free AI workshop",
    "corporate AI training",
    "learn AI online India",
    "Verlin Labs",
  ],
  applicationName: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Verlin Labs — AI Training & Mental Models for Students, Engineers & PMs",
    description:
      "Verlin Labs — clarity-first AI training in India. Free 2-hour session, mental models, and live programs for students, engineers, and product managers.",
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    locale: "en_IN",
    images: [
      {
        url: "/images/hero-side.jpg",
        width: 1200,
        height: 630,
        alt: "Verlin Labs — clarity-first learning for the AI age",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verlin Labs — AI Training & Mental Models for Students, Engineers & PMs",
    description:
      "Verlin Labs — clarity-first AI training in India. Free 2-hour session, mental models, and live programs for students, engineers, and product managers.",
    images: ["/images/hero-side.jpg"],
  },
  ...(siteVerification ? { verification: siteVerification } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = getSiteConfig();

  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <link
          rel="sitemap"
          type="application/xml"
          title="Sitemap"
          href={`${SITE_ORIGIN}/sitemap.xml`}
        />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <SessionProvider>
          <ThemeProvider>
            <ToastProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-deep-teal focus:px-4 focus:py-2 focus:text-white"
              >
                Skip to content
              </a>
              <Navbar nav={getHeaderNavLinks()} />
              <RolePendingNotice />
              <AdminSiteChrome>
                <main id="main" className="flex-1">{children}</main>
              </AdminSiteChrome>
              <Footer
                tagline={site.footer.tagline}
                linkGroups={buildFooterLinkGroups()}
                social={site.footer.social}
                contact={site.footer.contact}
              />
              <PageViewTracker />
              <ChatWidgetLoader />
              <LegalAcceptanceGateLoader />
            </ToastProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}