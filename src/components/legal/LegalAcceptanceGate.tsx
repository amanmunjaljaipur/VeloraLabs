"use client";

import { LegalDocumentModal } from "@/components/legal/LegalDocumentModal";
import { Button } from "@/components/ui/Button";
import { formatLegalDate } from "@/lib/legal/render";
import type { PublicLegalDocument } from "@/lib/legal/types";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SKIP_PREFIXES = ["/login", "/signup", "/terms", "/privacy", "/refund-policy"];
const ACCEPTED_SESSION_KEY = "verlin-legal-accepted";

interface LegalStatus {
  pending: boolean;
  firstTime?: boolean;
  terms?: PublicLegalDocument;
  privacy?: PublicLegalDocument;
  current?: { termsVersion: number; privacyVersion: number };
}

function sessionHasCurrentLegalAcceptance(
  user:
    | {
        legalTermsVersion?: number;
        legalPrivacyVersion?: number;
        requiredLegalTermsVersion?: number;
        requiredLegalPrivacyVersion?: number;
      }
    | undefined
): boolean {
  if (!user) return false;
  if (
    user.legalTermsVersion == null ||
    user.legalPrivacyVersion == null ||
    user.requiredLegalTermsVersion == null ||
    user.requiredLegalPrivacyVersion == null
  ) {
    return false;
  }

  return (
    user.legalTermsVersion >= user.requiredLegalTermsVersion &&
    user.legalPrivacyVersion >= user.requiredLegalPrivacyVersion
  );
}

export function LegalAcceptanceGate() {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const [legalStatus, setLegalStatus] = useState<LegalStatus | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [checked, setChecked] = useState(false);
  const [modalType, setModalType] = useState<"terms" | "privacy" | null>(null);
  const [agreed, setAgreed] = useState(false);
  const checkedForEmail = useRef<string | null>(null);

  const shouldSkip = SKIP_PREFIXES.some((p) => pathname.startsWith(p));
  const userEmail = session?.user?.email?.toLowerCase() ?? null;

  const checkStatus = useCallback(async () => {
    const res = await fetch("/api/legal/status", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as LegalStatus & {
      authenticated?: boolean;
      accepted?: { termsVersion: number; privacyVersion: number } | null;
    };
    if (!data.authenticated) {
      setLegalStatus(null);
      return;
    }

    setLegalStatus({
      pending: data.pending,
      firstTime: data.pending && !data.accepted,
      terms: data.pending ? data.terms : undefined,
      privacy: data.pending ? data.privacy : undefined,
      current: data.current,
    });

    if (!data.pending) {
      sessionStorage.setItem(ACCEPTED_SESSION_KEY, "1");
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      sessionStorage.removeItem(ACCEPTED_SESSION_KEY);
      setLegalStatus(null);
      setChecked(true);
      checkedForEmail.current = null;
      return;
    }

    if (status !== "authenticated" || shouldSkip || !userEmail) {
      setChecked(true);
      return;
    }

    if (sessionHasCurrentLegalAcceptance(session?.user)) {
      setLegalStatus({ pending: false });
      setChecked(true);
      checkedForEmail.current = userEmail;
      sessionStorage.setItem(ACCEPTED_SESSION_KEY, "1");
      return;
    }

    if (sessionStorage.getItem(ACCEPTED_SESSION_KEY) === "1") {
      setLegalStatus({ pending: false });
      setChecked(true);
      checkedForEmail.current = userEmail;
      return;
    }

    if (checkedForEmail.current === userEmail) {
      setChecked(true);
      return;
    }

    checkedForEmail.current = userEmail;
    checkStatus().finally(() => setChecked(true));
  }, [status, shouldSkip, userEmail, checkStatus]);

  async function handleAccept() {
    setAccepting(true);
    const res = await fetch("/api/legal/accept", { method: "POST" });
    setAccepting(false);
    if (!res.ok) return;

    const data = (await res.json()) as {
      current: { termsVersion: number; privacyVersion: number };
    };

    await update({
      legalTermsVersion: data.current.termsVersion,
      legalPrivacyVersion: data.current.privacyVersion,
    });

    sessionStorage.setItem(ACCEPTED_SESSION_KEY, "1");
    setLegalStatus({
      pending: false,
      current: data.current,
    });
    setAgreed(false);
  }

  if (!checked || status !== "authenticated" || shouldSkip || !legalStatus?.pending) {
    return (
      <>
        <LegalDocumentModal
          open={modalType === "terms"}
          onClose={() => setModalType(null)}
          document={legalStatus?.terms ?? null}
        />
        <LegalDocumentModal
          open={modalType === "privacy"}
          onClose={() => setModalType(null)}
          document={legalStatus?.privacy ?? null}
        />
      </>
    );
  }

  const terms = legalStatus.terms;
  const privacy = legalStatus.privacy;

  return (
    <>
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Accept updated legal policies"
          className="max-h-[min(90dvh,36rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
        >
          <h2 className="text-xl font-semibold text-foreground">
            {legalStatus.firstTime ? "Legal policies" : "Updated policies"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {legalStatus.firstTime
              ? "Please review and accept our Terms of Service and Privacy Policy to continue using your Verlin Labs account."
              : "We have updated our Terms of Service and/or Privacy Policy. Please review and accept to continue using your Verlin Labs account."}
          </p>

          <ul className="mt-4 space-y-2 text-sm">
            {terms && (
              <li className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
                <span>
                  <span className="font-medium text-foreground">Terms of Service</span>
                  <span className="ml-2 text-xs text-text-secondary">
                    v{terms.version} · {formatLegalDate(terms.lastUpdated)}
                  </span>
                </span>
                <button
                  type="button"
                  className="text-sm font-medium text-accent-teal hover:underline"
                  onClick={() => setModalType("terms")}
                >
                  Read
                </button>
              </li>
            )}
            {privacy && (
              <li className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
                <span>
                  <span className="font-medium text-foreground">Privacy Policy</span>
                  <span className="ml-2 text-xs text-text-secondary">
                    v{privacy.version} · {formatLegalDate(privacy.lastUpdated)}
                  </span>
                </span>
                <button
                  type="button"
                  className="text-sm font-medium text-accent-teal hover:underline"
                  onClick={() => setModalType("privacy")}
                >
                  Read
                </button>
              </li>
            )}
          </ul>

          <label className="mt-5 flex items-start gap-2.5 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-accent-teal focus:ring-accent-teal/30"
            />
            <span>
              I have read and agree to the current Terms of Service and Privacy Policy.
            </span>
          </label>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              onClick={handleAccept}
              loading={accepting}
              disabled={!agreed}
            >
              Accept and continue
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                sessionStorage.removeItem(ACCEPTED_SESSION_KEY);
                signOut({ callbackUrl: "/" });
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <LegalDocumentModal
        open={modalType === "terms"}
        onClose={() => setModalType(null)}
        document={terms ?? null}
      />
      <LegalDocumentModal
        open={modalType === "privacy"}
        onClose={() => setModalType(null)}
        document={privacy ?? null}
      />
    </>
  );
}