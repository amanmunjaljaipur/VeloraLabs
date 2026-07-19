import type { Metadata } from "next";
import { Outfit, Work_Sans, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
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

/** Modern SaaS body / UI - Work Sans (2025 revamp) */
const inter = Work_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/** Modern SaaS display - Outfit geometric headlines (2025 revamp) */
const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/** Optional mono for technical captions only */
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const siteVerification = buildSiteVerification();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Verlin Labs - AI Training & Mental Models for Students, Engineers & PMs",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Verlin Labs - clarity-first AI training in India. Free 2-hour session, mental models, and live programs for students, engineers, and product managers.",
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
    title: "Verlin Labs - AI Training & Mental Models for Students, Engineers & PMs",
    description:
      "Verlin Labs - clarity-first AI training in India. Free 2-hour session, mental models, and live programs for students, engineers, and product managers.",
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    locale: "en_IN",
    images: [
      {
        url: "/images/brand-hero-clarity.jpg",
        width: 1200,
        height: 630,
        alt: "Verlin Labs - clarity-first learning for the AI age",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verlin Labs - AI Training & Mental Models for Students, Engineers & PMs",
    description:
      "Verlin Labs - clarity-first AI training in India. Free 2-hour session, mental models, and live programs for students, engineers, and product managers.",
    images: ["/images/brand-hero-clarity.jpg"],
  },
  ...(siteVerification ? { verification: siteVerification } : {}),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = getSiteConfig();
  const headerList = await headers();
  // Set by middleware for /apps/* - hide Verlin Labs navbar, footer, admin chrome, chatbot
  const standaloneApp = headerList.get("x-vl-app-shell") === "1";

  if (standaloneApp) {
    // Viewport-locked shell: document does not scroll; product <main> does.
    // min-h-0 on every flex step is required for overflow-y-auto children.
    return (
      <html
        lang="en"
        className={`${inter.variable} ${display.variable} ${mono.variable} h-dvh max-h-dvh overflow-hidden`}
        suppressHydrationWarning
      >
        <body className="h-dvh max-h-dvh overflow-hidden antialiased">
          <ThemeProvider>
            <ToastProvider>
              <main
                id="main"
                className="flex h-dvh max-h-dvh min-h-0 w-full flex-col overflow-hidden"
              >
                {children}
              </main>
            </ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} ${display.variable} ${mono.variable} h-full`}
      suppressHydrationWarning
    >
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
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-navy focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2"
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