"use client";

import { SITE_ORIGIN } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Check, Copy, Mail, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ShareButtonsProps {
  /** Relative path (e.g. `/library/my-post`) or absolute URL. */
  url: string;
  title: string;
  className?: string;
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M22.675 0h-21.35C.6 0 0 .6 0 1.326v21.348C0 23.4.6 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.4 24 24 23.4 24 22.674V1.326C24 .6 23.4 0 22.675 0z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .105 5.36.103 11.943c0 2.096.547 4.142 1.588 5.945L0 24l6.257-1.638a11.867 11.867 0 0 0 5.786 1.472h.005c6.582 0 11.94-5.36 11.943-11.943a11.87 11.87 0 0 0-3.47-8.442zm-8.475 18.354h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.744.981.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.234c.002-5.45 4.437-9.884 9.892-9.884 2.642 0 5.126 1.03 6.994 2.899a9.822 9.822 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.893 9.884zm5.427-7.406c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 0C8.74 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.74 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.986 8.74 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.014 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.897 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.897-.421-.419-.69-.824-.897-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.207-.57.476-.96.897-1.381.419-.419.81-.689 1.379-.896.42-.165 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

const ICON_BTN =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/90 bg-transparent text-foreground/70 transition-colors duration-200 ease-out hover:border-accent-teal/40 hover:bg-accent-teal/10 hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20 focus-visible:ring-offset-2 dark:focus-visible:ring-white/30";

/**
 * Share this article/blog post to LinkedIn, Facebook, X, WhatsApp, email, or
 * (via copy-link, since Instagram has no web share intent) Instagram - plus
 * a native OS share sheet on mobile. No API keys or account connections
 * required; everything runs through public share-intent URLs.
 */
export function ShareButtons({ url, title, className }: ShareButtonsProps) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const absoluteUrl = url.startsWith("http") ? url : `${SITE_ORIGIN}${url}`;
  const encodedUrl = encodeURIComponent(absoluteUrl);
  const encodedTitle = encodeURIComponent(title);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  const links = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  };

  const openPopup = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=640");
  };

  const copyLink = async (message: string) => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setNote(message);
    } catch {
      setCopied(false);
      setNote("Could not copy automatically - copy the link from the address bar.");
    } finally {
      setTimeout(() => {
        setCopied(false);
        setNote(null);
      }, 3000);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, url: absoluteUrl });
    } catch {
      // User cancelled the share sheet - nothing to do.
    }
  };

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        Share this
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {canNativeShare && (
          <button
            type="button"
            onClick={() => void handleNativeShare()}
            aria-label="Share"
            title="Share"
            className={ICON_BTN}
          >
            <Share2 className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => openPopup(links.linkedin)}
          aria-label="Share on LinkedIn"
          title="Share on LinkedIn"
          className={ICON_BTN}
        >
          <LinkedInIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => openPopup(links.facebook)}
          aria-label="Share on Facebook"
          title="Share on Facebook"
          className={ICON_BTN}
        >
          <FacebookIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => openPopup(links.x)}
          aria-label="Share on X"
          title="Share on X"
          className={ICON_BTN}
        >
          <XIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => openPopup(links.whatsapp)}
          aria-label="Share on WhatsApp"
          title="Share on WhatsApp"
          className={ICON_BTN}
        >
          <WhatsAppIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => void copyLink("Link copied - paste it into your Instagram bio or story")}
          aria-label="Copy link to share on Instagram"
          title="Instagram does not support direct links - copy the link to share"
          className={ICON_BTN}
        >
          <InstagramIcon className="h-4 w-4" />
        </button>
        <a
          href={links.email}
          aria-label="Share by email"
          title="Share by email"
          className={ICON_BTN}
        >
          <Mail className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={() => void copyLink("Link copied")}
          aria-label="Copy link"
          title="Copy link"
          className={cn(ICON_BTN, "w-auto gap-1.5 px-3")}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="text-xs font-medium">{copied ? "Copied" : "Copy link"}</span>
        </button>
      </div>
      {note && (
        <p role="status" aria-live="polite" className="text-xs text-accent-teal">
          {note}
        </p>
      )}
    </div>
  );
}
