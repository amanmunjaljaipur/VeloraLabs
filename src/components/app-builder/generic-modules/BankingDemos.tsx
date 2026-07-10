"use client";

/**
 * Real, clickable mock modules for banking/fintech "authenticated" demo pages
 * (dashboard, payments/transfer, card controls). These replace static
 * bodyHtml prose for pages whose path/title match known banking module
 * keywords — see detectBankingModule() below.
 *
 * Everything here is client-side mocked state — no real money moves, no
 * backend calls — but every button actually does something: state changes,
 * validation runs, a multi-step flow advances. That is the point: the demo
 * should feel like a working product, not a spec document.
 */

import { withAlpha, type ShopThemeTokens } from "@/lib/app-builder/shop-theme";
import { CheckCircle2, CreditCard, Lock, Send, Snowflake, XCircle } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";

export type BankingModuleType = "dashboard" | "payments" | "cards";

/** Match a generic page to a known interactive banking module by path/title keywords. */
export function detectBankingModule(page: { path: string; title: string; id?: string }): BankingModuleType | null {
  const s = `${page.path} ${page.title} ${page.id || ""}`.toLowerCase();
  if (/(payment|transfer|send.?money|pay-)/.test(s)) return "payments";
  if (/card/.test(s)) return "cards";
  if (/(dashboard|overview|account.?summary|home-authenticated)/.test(s)) return "dashboard";
  return null;
}

function cardStyle(theme: ShopThemeTokens): CSSProperties {
  return {
    borderColor: withAlpha(theme.primary, 0.25),
  };
}

const MOCK_TRANSACTIONS = [
  { id: "t1", name: "Amazon", category: "Shopping", amount: -1249, date: "Today" },
  { id: "t2", name: "Salary credit", category: "Income", amount: 68000, date: "Yesterday" },
  { id: "t3", name: "Zomato", category: "Food", amount: -540, date: "Yesterday" },
  { id: "t4", name: "Electricity board", category: "Bills", amount: -2100, date: "3 days ago" },
  { id: "t5", name: "Rahul S.", category: "Transfer received", amount: 5000, date: "5 days ago" },
];

function formatInr(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-IN");
  return `${n < 0 ? "-" : ""}₹${s}`;
}

export function DashboardDemo({
  theme,
  brandName,
  onNavigate,
  paymentsPath,
  cardsPath,
}: {
  theme: ShopThemeTokens;
  brandName: string;
  onNavigate: (path: string) => void;
  paymentsPath?: string;
  cardsPath?: string;
}) {
  const [statementNote, setStatementNote] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5" style={cardStyle(theme)}>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Savings account</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: theme.secondary }}>
            {formatInr(184320)}
          </p>
          <p className="mt-1 text-xs text-text-muted">•••• 4821 · Available balance</p>
        </div>
        <div className="rounded-2xl border bg-card p-5" style={cardStyle(theme)}>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Current account</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: theme.secondary }}>
            {formatInr(42150)}
          </p>
          <p className="mt-1 text-xs text-text-muted">•••• 7790 · Available balance</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold" style={{ color: theme.secondary }}>
          Quick actions
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => (paymentsPath ? onNavigate(paymentsPath) : null)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: theme.primary }}
          >
            <Send className="h-4 w-4" /> Send money
          </button>
          <button
            type="button"
            onClick={() => (cardsPath ? onNavigate(cardsPath) : null)}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: withAlpha(theme.primary, 0.4), color: theme.primary }}
          >
            <CreditCard className="h-4 w-4" /> Manage cards
          </button>
          <button
            type="button"
            onClick={() => setStatementNote(`Statement for ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} generated — demo download would start here.`)}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
          >
            Download statement
          </button>
        </div>
        {statementNote ? (
          <p className="mt-2 text-xs" style={{ color: theme.primary }}>
            {statementNote}
          </p>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold" style={{ color: theme.secondary }}>
          Recent transactions
        </p>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {MOCK_TRANSACTIONS.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-text-muted">
                  {t.category} · {t.date}
                </p>
              </div>
              <p className={t.amount < 0 ? "font-semibold text-red-600" : "font-semibold text-emerald-600"}>
                {formatInr(t.amount)}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Demo data for {brandName} — states shown: loaded, mixed credits/debits.
        </p>
      </div>
    </div>
  );
}

type PaymentStep = "form" | "review" | "otp" | "success" | "fail";

export function PaymentsFlowDemo({ theme }: { theme: ShopThemeTokens }) {
  const [step, setStep] = useState<PaymentStep>("form");
  const [payee, setPayee] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [failReason, setFailReason] = useState("");

  const amountNum = Number(amount);
  const reference = useMemo(() => `TXN${Date.now().toString().slice(-8)}`, [step === "success"]);

  function submitForm() {
    if (!payee.trim() || !account.trim() || !amount || amountNum <= 0) {
      setError("Fill in payee, account/UPI ID, and a valid amount.");
      return;
    }
    setError(null);
    setStep("review");
  }

  function confirmReview() {
    setStep("otp");
    setOtp("");
    setError(null);
  }

  function verifyOtp() {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code sent to your phone.");
      return;
    }
    if (amountNum > 100000) {
      setFailReason("Exceeds your demo daily transfer limit of ₹1,00,000.");
      setStep("fail");
      return;
    }
    setError(null);
    setStep("success");
  }

  function reset() {
    setStep("form");
    setPayee("");
    setAccount("");
    setAmount("");
    setOtp("");
    setError(null);
  }

  return (
    <div className="rounded-2xl border bg-card p-5" style={cardStyle(theme)}>
      <div className="mb-4 flex items-center gap-2 text-xs font-medium text-text-muted">
        {(["form", "review", "otp"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
              style={
                step === s || (step === "success" && i <= 2) || (step === "fail" && i <= 2)
                  ? { background: theme.primary, color: "#fff" }
                  : { background: withAlpha(theme.primary, 0.12), color: theme.primary }
              }
            >
              {i + 1}
            </span>
            {i < 2 ? <span className="h-px w-6 bg-border" /> : null}
          </div>
        ))}
        <span className="ml-2 capitalize">{step === "otp" ? "Verify" : step === "form" ? "Details" : step}</span>
      </div>

      {step === "form" ? (
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Pay to</span>
            <input
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Account / UPI ID</span>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="e.g. rahul@upi"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Amount (₹)</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <button
            type="button"
            onClick={submitForm}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: theme.primary }}
          >
            Continue
          </button>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-3">
          <div className="space-y-2 rounded-xl border border-border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Pay to</span>
              <span className="font-medium">{payee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Account / UPI</span>
              <span className="font-medium">{account}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Amount</span>
              <span className="font-semibold" style={{ color: theme.secondary }}>
                {formatInr(amountNum)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={confirmReview}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: theme.primary }}
            >
              Confirm & send
            </button>
          </div>
        </div>
      ) : null}

      {step === "otp" ? (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Enter the 6-digit code sent to your registered phone (demo — any 6 digits work).
          </p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-lg tracking-[0.5em]"
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <button
            type="button"
            onClick={verifyOtp}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: theme.primary }}
          >
            Verify & pay
          </button>
        </div>
      ) : null}

      {step === "success" ? (
        <div className="space-y-3 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <p className="text-lg font-semibold">Payment sent</p>
          <p className="text-sm text-text-secondary">
            {formatInr(amountNum)} to {payee}
          </p>
          <p className="text-xs text-text-muted">Reference {reference}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
          >
            Make another payment
          </button>
        </div>
      ) : null}

      {step === "fail" ? (
        <div className="space-y-3 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-600" />
          <p className="text-lg font-semibold">Payment failed</p>
          <p className="text-sm text-text-secondary">{failReason}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
          >
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function CardControlsDemo({ theme, brandName }: { theme: ShopThemeTokens; brandName: string }) {
  const [frozen, setFrozen] = useState(false);
  const [limit, setLimit] = useState(50000);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-opacity"
        style={{
          background: frozen
            ? "linear-gradient(135deg, #64748b, #334155)"
            : `linear-gradient(135deg, ${theme.heroFrom}, ${theme.primary}, ${theme.heroTo})`,
          opacity: frozen ? 0.75 : 1,
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide">{brandName}</p>
          {frozen ? <Snowflake className="h-5 w-5" /> : <CreditCard className="h-5 w-5" /> }
        </div>
        <p className="mt-8 text-xl font-mono tracking-widest">•••• •••• •••• 4821</p>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span>CARDHOLDER<br /><span className="text-sm font-medium">{brandName} Demo User</span></span>
          <span>{frozen ? "FROZEN" : "ACTIVE"}</span>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5" style={cardStyle(theme)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{frozen ? "Card is frozen" : "Freeze this card"}</p>
            <p className="text-xs text-text-muted">
              {frozen ? "New transactions are blocked until you unfreeze it." : "Instantly block new transactions."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFrozen((f) => !f);
              setSavedNote(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
            style={
              frozen
                ? { background: theme.primary, color: "#fff", borderColor: theme.primary }
                : { borderColor: withAlpha(theme.primary, 0.4), color: theme.primary }
            }
          >
            <Lock className="h-4 w-4" />
            {frozen ? "Unfreeze card" : "Freeze card"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5" style={cardStyle(theme)}>
        <p className="text-sm font-semibold">Daily spending limit</p>
        <p className="mt-1 text-2xl font-bold" style={{ color: theme.secondary }}>
          {formatInr(limit)}
        </p>
        <input
          type="range"
          min={5000}
          max={200000}
          step={5000}
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setSavedNote(null);
          }}
          className="mt-3 w-full accent-current"
          style={{ color: theme.primary }}
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSavedNote("Saved — new limit applies immediately (demo).")}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: theme.primary }}
          >
            Save changes
          </button>
          {savedNote ? <p className="text-xs text-emerald-600">{savedNote}</p> : null}
        </div>
      </div>
    </div>
  );
}
