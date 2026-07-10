"use client";

/**
 * Real digital-banking demo: balances, send-money wizard, freeze cards, support/ops boards.
 */

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { StudioAppSpec, StudioRole } from "@/lib/app-studio/types";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  CheckCircle2,
  CreditCard,
  Landmark,
  Shield,
  UserRound,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

type Row = Record<string, unknown> & { id: string };

function seed(entityId: string, rows: Array<Record<string, unknown>> | undefined): Row[] {
  return (rows || []).map((r, i) => ({ id: `seed-${entityId}-${i}`, ...r }));
}

function inr(n: unknown) {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString("en-IN")}`;
}

export function BankingProductApp({
  spec,
  role,
  roleId,
  onRoleChange,
  fullScreen,
}: {
  spec: StudioAppSpec;
  role?: StudioRole;
  roleId: string;
  onRoleChange: (id: string) => void;
  fullScreen?: boolean;
}) {
  const accountE =
    spec.entities.find((e) => /account/i.test(e.id)) || spec.entities[0];
  const transferE =
    spec.entities.find((e) => /transfer|payment|txn/i.test(e.id)) ||
    spec.entities[1];
  const cardE = spec.entities.find((e) => /card/i.test(e.id));
  const caseE = spec.entities.find((e) => /case|support|ticket/i.test(e.id));

  const [accounts, setAccounts] = useState(() => seed("account", accountE?.seed));
  const [transfers, setTransfers] = useState(() => seed("transfer", transferE?.seed));
  const [cards, setCards] = useState(() => seed("card", cardE?.seed));
  const [cases, setCases] = useState(() => seed("case", caseE?.seed));
  const [tab, setTab] = useState<"home" | "send" | "cards" | "transfers" | "cases">(
    "home"
  );
  const [toast, setToast] = useState<string | null>(null);

  // Send money wizard
  const [step, setStep] = useState(0);
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [fromAcct, setFromAcct] = useState(
    () => String(accounts[0]?.title || "Everyday Savings")
  );

  const totalBalance = useMemo(
    () =>
      accounts
        .filter((a) => String(a.status) === "Active")
        .reduce((s, a) => s + (Number(a.amount) || 0), 0),
    [accounts]
  );

  const isSupport = /support|agent/i.test(role?.id || role?.label || "");
  const isOps = /ops|admin|bank/i.test(role?.id || "") && !isSupport;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function completeTransfer() {
    const amt = Number(amount) || 0;
    if (!payee.trim() || amt <= 0) {
      flash("Enter payee and amount");
      return;
    }
    const row: Row = {
      id: `tx-${Date.now().toString(36)}`,
      title: payee.trim(),
      amount: amt,
      description: note || "Transfer",
      plan: fromAcct,
      status: "Completed",
    };
    setTransfers((prev) => [row, ...prev]);
    setAccounts((prev) =>
      prev.map((a) =>
        String(a.title) === fromAcct
          ? { ...a, amount: Math.max(0, (Number(a.amount) || 0) - amt) }
          : a
      )
    );
    setStep(0);
    setPayee("");
    setAmount("");
    setNote("");
    setTab("transfers");
    flash(`Sent ${inr(amt)} to ${payee.trim()}`);
  }

  function freezeCard(id: string, status: string) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    flash(status === "Frozen" ? "Card frozen" : `Card → ${status}`);
  }

  const tabs: Array<{ id: typeof tab; label: string; show: boolean }> = [
    { id: "home", label: "Home", show: !isSupport },
    { id: "send", label: "Send money", show: !isSupport && !isOps },
    { id: "cards", label: "Cards", show: true },
    { id: "transfers", label: "Transfers", show: true },
    { id: "cases", label: "Cases", show: Boolean(caseE) && (isSupport || isOps) },
  ];

  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground",
        fullScreen ? "h-full min-h-0" : "h-full min-h-[520px] rounded-xl border border-border overflow-hidden"
      )}
    >
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 md:px-5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ background: spec.primaryColor }}
            >
              <Landmark className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold" style={{ color: spec.primaryColor }}>
                {spec.brandName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Demo banking · no real money
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border-2 border-accent-teal/40 bg-accent-teal/10 px-2.5 py-1.5">
            <UserRound className="h-4 w-4 text-accent-teal" />
            <select
              value={roleId}
              onChange={(e) => {
                onRoleChange(e.target.value);
                setTab("home");
              }}
              className="max-w-[12rem] bg-transparent text-sm font-bold outline-none"
            >
              {spec.roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 border-t border-border/50 px-3 py-1.5 md:px-5">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-sm font-medium",
                  tab === t.id
                    ? "bg-accent-teal/15 text-accent-teal"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {t.label}
              </button>
            ))}
        </nav>
      </header>

      {toast && (
        <div className="bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle2 className="mr-1 inline h-4 w-4" />
          {toast}
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-3 py-5 md:px-5">
        {tab === "home" && (
          <div className="space-y-5">
            <Card
              className="overflow-hidden p-0 text-white"
              style={{
                background: `linear-gradient(135deg, ${spec.primaryColor}, #0d9488)`,
              }}
            >
              <div className="p-6 md:p-8">
                <p className="text-sm text-white/80">Total available</p>
                <p className="mt-1 text-4xl font-bold tracking-tight md:text-5xl">
                  {inr(totalBalance)}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Viewing as {role?.label || "Customer"} · {accounts.length} accounts
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {!isSupport && !isOps && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="bg-white text-slate-900 hover:bg-white/90"
                      onClick={() => {
                        setTab("send");
                        setStep(0);
                      }}
                    >
                      <ArrowRightLeft className="h-4 w-4" /> Send money
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
                    onClick={() => setTab("cards")}
                  >
                    <CreditCard className="h-4 w-4" /> Manage cards
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((a) => (
                <Card key={a.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-accent-teal" />
                      <p className="font-semibold">{String(a.title)}</p>
                    </div>
                    <Badge className="bg-muted">{String(a.status)}</Badge>
                  </div>
                  <p className="mt-3 text-2xl font-bold">{inr(a.amount)}</p>
                  <p className="text-xs text-muted-foreground">{String(a.level || "Account")}</p>
                </Card>
              ))}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                Recent transfers
              </h3>
              <div className="space-y-2">
                {transfers.slice(0, 4).map((t) => (
                  <Card
                    key={t.id}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div>
                      <p className="font-medium">{String(t.title)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(t.description || "")} · {String(t.plan || "")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{inr(t.amount)}</p>
                      <Badge className="bg-muted text-[10px]">{String(t.status)}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "send" && (
          <Card className="mx-auto max-w-lg space-y-4 p-6">
            <h2 className="text-xl font-semibold">Send money</h2>
            <div className="flex gap-2 text-xs font-medium">
              {["Details", "Review", "Done"].map((label, i) => (
                <span
                  key={label}
                  className={cn(
                    "rounded-full px-2.5 py-1",
                    step === i
                      ? "bg-accent-teal/15 text-accent-teal"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1}. {label}
                </span>
              ))}
            </div>

            {step === 0 && (
              <>
                <label className="block text-sm">
                  <span className="font-medium">Payee name / UPI</span>
                  <Input
                    className="mt-1"
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    placeholder="e.g. Asha Sharma or name@upi"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Amount (₹)</span>
                  <Input
                    className="mt-1"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1500"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">From account</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={fromAcct}
                    onChange={(e) => setFromAcct(e.target.value)}
                  >
                    {accounts
                      .filter((a) => String(a.status) === "Active")
                      .map((a) => (
                        <option key={a.id} value={String(a.title)}>
                          {String(a.title)} ({inr(a.amount)})
                        </option>
                      ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Note</span>
                  <Input
                    className="mt-1"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Rent / dinner / etc."
                  />
                </label>
                <Button type="button" variant="cta" onClick={() => setStep(1)}>
                  Continue to review
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-2">
                  <p>
                    <strong>To:</strong> {payee || "—"}
                  </p>
                  <p>
                    <strong>Amount:</strong> {inr(amount)}
                  </p>
                  <p>
                    <strong>From:</strong> {fromAcct}
                  </p>
                  <p>
                    <strong>Note:</strong> {note || "—"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Demo 2FA: confirm to complete transfer
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button type="button" variant="cta" onClick={completeTransfer}>
                    Confirm & send
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {tab === "cards" && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Cards</h2>
            <p className="text-sm text-muted-foreground">
              Freeze a lost card instantly. Unfreeze when you find it.
            </p>
            {cards.map((c) => (
              <Card
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-20 items-center justify-center rounded-lg text-white text-xs font-bold"
                    style={{ background: spec.primaryColor }}
                  >
                    {String(c.level || "CARD")}
                  </div>
                  <div>
                    <p className="font-semibold">{String(c.title)}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(c.description || "")} · limit {inr(c.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-muted">{String(c.status)}</Badge>
                  {String(c.status) === "Active" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => freezeCard(c.id, "Frozen")}
                    >
                      Freeze
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="cta"
                      onClick={() => freezeCard(c.id, "Active")}
                    >
                      Unfreeze
                    </Button>
                  )}
                </div>
              </Card>
            ))}
            {cards.length === 0 && (
              <p className="text-sm text-muted-foreground">No cards in this demo seed.</p>
            )}
          </div>
        )}

        {tab === "transfers" && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Transfers</h2>
            {transfers.map((t) => (
              <Card
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-semibold">{String(t.title)}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(t.description || "")} · from {String(t.plan || "—")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{inr(t.amount)}</p>
                  {(isOps || isSupport) && transferE?.statuses ? (
                    <select
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                      value={String(t.status)}
                      onChange={(e) => {
                        setTransfers((prev) =>
                          prev.map((x) =>
                            x.id === t.id ? { ...x, status: e.target.value } : x
                          )
                        );
                        flash(`Transfer → ${e.target.value}`);
                      }}
                    >
                      {(transferE.statuses || []).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge className="bg-muted">{String(t.status)}</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "cases" && caseE && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Support cases</h2>
            {cases.map((c) => (
              <Card
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-semibold">{String(c.title)}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(c.memberName || "")} · {String(c.description || "")}
                  </p>
                </div>
                <select
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                  value={String(c.status)}
                  onChange={(e) => {
                    setCases((prev) =>
                      prev.map((x) =>
                        x.id === c.id ? { ...x, status: e.target.value } : x
                      )
                    );
                    flash(`Case → ${e.target.value}`);
                  }}
                >
                  {(caseE.statuses || ["Open", "In progress", "Resolved"]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
