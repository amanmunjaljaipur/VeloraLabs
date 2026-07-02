import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getSiteConfig } from "@/lib/content";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Verlin Labs — Clarity-First Learning",
    template: "%s | Verlin Labs",
  },
  description:
    "A clarity-first learning platform that helps people deeply understand complex ideas — especially AI and technology — through strong mental models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = getSiteConfig();

  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
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
            <Navbar nav={site.nav} />
            <main id="main" className="flex-1">{children}</main>
            <Footer
              tagline={site.footer.tagline}
              links={site.footer.links}
              social={site.footer.social}
            />
          </ToastProvider>
        </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}