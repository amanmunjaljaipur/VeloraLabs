"use client";

/**
 * Full digital-banking product demo (~18 modules).
 * Validations + success/failure messages + pass/fail paths built in.
 * Uses brand/roles from StudioAppSpec; seed data is complete even if spec is thin.
 */

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { mockApiCall, type MockPathMode } from "@/lib/app-studio/mock-api";
import type { StudioAppSpec, StudioRole } from "@/lib/app-studio/types";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  CheckCircle2,
  CreditCard,
  FileText,
  HelpCircle,
  Landmark,
  LineChart,
  Loader2,
  Lock,
  PiggyBank,
  Receipt,
  Shield,
  Smartphone,
  UserRound,
  Users,
  Wallet,
  XCircle,
  Building2,
  CalendarClock,
  Scale,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

type Row = Record<string, unknown> & { id: string };
type ToastKind = "success" | "error" | "info";
type ModuleId =
  | "home"
  | "accounts"
  | "send"
  | "upi"
  | "beneficiaries"
  | "bills"
  | "cards"
  | "transactions"
  | "statements"
  | "insights"
  | "deposits"
  | "loans"
  | "scheduled"
  | "limits"
  | "kyc"
  | "security"
  | "notifications"
  | "disputes"
  | "support"
  | "ops";

const MODULES: Array<{
  id: ModuleId;
  label: string;
  icon: ReactNode;
  roles?: string[]; // empty = all; match role id loosely
}> = [
  { id: "home", label: "Home", icon: <Landmark className="h-3.5 w-3.5" /> },
  { id: "accounts", label: "Accounts", icon: <Wallet className="h-3.5 w-3.5" /> },
  { id: "send", label: "Send money", icon: <ArrowRightLeft className="h-3.5 w-3.5" /> },
  { id: "upi", label: "UPI", icon: <Smartphone className="h-3.5 w-3.5" /> },
  { id: "beneficiaries", label: "Payees", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "bills", label: "Bills", icon: <Receipt className="h-3.5 w-3.5" /> },
  { id: "cards", label: "Cards", icon: <CreditCard className="h-3.5 w-3.5" /> },
  { id: "transactions", label: "Transactions", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "statements", label: "Statements", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "insights", label: "Insights", icon: <LineChart className="h-3.5 w-3.5" /> },
  { id: "deposits", label: "Deposits", icon: <PiggyBank className="h-3.5 w-3.5" /> },
  { id: "loans", label: "Loans", icon: <Building2 className="h-3.5 w-3.5" /> },
  { id: "scheduled", label: "Scheduled", icon: <CalendarClock className="h-3.5 w-3.5" /> },
  { id: "limits", label: "Limits", icon: <Scale className="h-3.5 w-3.5" /> },
  { id: "kyc", label: "KYC", icon: <Shield className="h-3.5 w-3.5" /> },
  { id: "security", label: "Security", icon: <Lock className="h-3.5 w-3.5" /> },
  { id: "notifications", label: "Alerts", icon: <Bell className="h-3.5 w-3.5" /> },
  { id: "disputes", label: "Disputes", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { id: "support", label: "Support", icon: <HelpCircle className="h-3.5 w-3.5" /> },
  { id: "ops", label: "Ops queue", icon: <Shield className="h-3.5 w-3.5" />, roles: ["ops", "admin", "support"] },
];

function inr(n: unknown) {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString("en-IN")}`;
}

function uid(p: string) {
  return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

function defaultAccounts(): Row[] {
  return [
    { id: "a1", title: "Everyday Savings", level: "Savings", amount: 84250, status: "Active", ifsc: "HZBN0001234" },
    { id: "a2", title: "Salary Current", level: "Current", amount: 126400, status: "Active", ifsc: "HZBN0001234" },
    { id: "a3", title: "UPI Wallet", level: "Wallet", amount: 2340, status: "Active", ifsc: "—" },
    { id: "a4", title: "Emergency Fund", level: "Savings", amount: 50000, status: "Frozen", ifsc: "HZBN0001234" },
  ];
}

function defaultTransfers(): Row[] {
  return [
    { id: "t1", title: "Asha Sharma", amount: 1500, description: "Dinner", plan: "UPI Wallet", status: "Completed", channel: "UPI" },
    { id: "t2", title: "BESCOM", amount: 2200, description: "Electricity", plan: "Salary Current", status: "Completed", channel: "Bill" },
    { id: "t3", title: "Rohan Mehta", amount: 25000, description: "Rent", plan: "Salary Current", status: "Pending", channel: "IMPS" },
    { id: "t4", title: "unknown@okaxis", amount: 9000, description: "Flagged", plan: "Everyday Savings", status: "2FA", channel: "UPI" },
  ];
}

function defaultCards(): Row[] {
  return [
    { id: "c1", title: "Primary debit", level: "Debit", amount: 50000, description: "•••• 4821", status: "Active" },
    { id: "c2", title: "Online virtual", level: "Virtual", amount: 15000, description: "•••• 9033", status: "Active" },
    { id: "c3", title: "Travel card", level: "Debit", amount: 20000, description: "•••• 1102", status: "Frozen" },
  ];
}

function roleMatches(roleId: string, roleLabel: string, allowed?: string[]) {
  if (!allowed?.length) return true;
  const blob = `${roleId} ${roleLabel}`.toLowerCase();
  return allowed.some((a) => blob.includes(a.toLowerCase()));
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
  const accountSeed = spec.entities.find((e) => /account/i.test(e.id))?.seed;
  const transferSeed = spec.entities.find((e) => /transfer|payment|txn/i.test(e.id))?.seed;
  const cardSeed = spec.entities.find((e) => /card/i.test(e.id))?.seed;

  const [accounts, setAccounts] = useState<Row[]>(() =>
    accountSeed?.length
      ? accountSeed.map((r, i) => ({ id: `a-${i}`, ...r }))
      : defaultAccounts()
  );
  const [transfers, setTransfers] = useState<Row[]>(() =>
    transferSeed?.length
      ? transferSeed.map((r, i) => ({ id: `t-${i}`, ...r }))
      : defaultTransfers()
  );
  const [cards, setCards] = useState<Row[]>(() =>
    cardSeed?.length ? cardSeed.map((r, i) => ({ id: `c-${i}`, ...r })) : defaultCards()
  );
  const [beneficiaries, setBeneficiaries] = useState<Row[]>([
    { id: "b1", title: "Asha Sharma", upi: "asha@okicici", account: "•••• 8821", status: "Verified" },
    { id: "b2", title: "Rohan Mehta", upi: "rohan@ybl", account: "•••• 4410", status: "Verified" },
    { id: "b3", title: "New vendor", upi: "vendor@oksbi", account: "•••• 2201", status: "Pending" },
  ]);
  const [bills, setBills] = useState<Row[]>([
    { id: "bill1", title: "BESCOM Electricity", amount: 1840, due: "12 Apr", status: "Due" },
    { id: "bill2", title: "Airtel Mobile", amount: 599, due: "18 Apr", status: "Due" },
    { id: "bill3", title: "BWSSB Water", amount: 320, due: "05 Apr", status: "Paid" },
  ]);
  const [deposits, setDeposits] = useState<Row[]>([
    { id: "d1", title: "FD 12 months", amount: 100000, rate: "7.1%", status: "Active", maturity: "Mar 2027" },
    { id: "d2", title: "RD Monthly", amount: 5000, rate: "6.5%", status: "Active", maturity: "Ongoing" },
  ]);
  const [loans, setLoans] = useState<Row[]>([
    { id: "l1", title: "Personal loan", amount: 240000, emi: 8200, status: "Active", due: "05 Apr" },
    { id: "l2", title: "Credit line", amount: 50000, emi: 0, status: "Available", due: "—" },
  ]);
  const [scheduled, setScheduled] = useState<Row[]>([
    { id: "s1", title: "Rent — Rohan", amount: 25000, when: "1st every month", status: "Active" },
    { id: "s2", title: "SIP Mutual fund", amount: 10000, when: "5th every month", status: "Active" },
  ]);
  const [cases, setCases] = useState<Row[]>([
    { id: "k1", title: "Card declined overseas", memberName: "You", status: "Open", description: "Singapore POS" },
    { id: "k2", title: "Transfer stuck Pending", memberName: "You", status: "In progress", description: "Rent 25k" },
  ]);
  const [disputes, setDisputes] = useState<Row[]>([
    { id: "dp1", title: "Unknown UPI debit", amount: 499, status: "Open", date: "02 Apr" },
  ]);
  const [notifications, setNotifications] = useState<Row[]>([
    { id: "n1", title: "Login from new device", status: "Unread", description: "Chrome · Bengaluru" },
    { id: "n2", title: "FD interest credited", status: "Read", description: "₹1,820" },
    { id: "n3", title: "Card spend alert", status: "Unread", description: "₹2,400 Amazon" },
  ]);
  const [limits, setLimits] = useState({
    dailyTransfer: 100000,
    upi: 25000,
    cardPos: 50000,
    cardOnline: 15000,
  });
  const [kyc, setKyc] = useState({
    pan: "ABCDE1234F",
    aadhaar: "•••• 4521",
    status: "Verified" as string,
    address: "Indiranagar, Bengaluru",
  });
  const [security, setSecurity] = useState({
    twoFa: true,
    biometric: true,
    devices: 2,
  });
  const [hideBalance, setHideBalance] = useState(false);
  const [tab, setTab] = useState<ModuleId>("home");
  const [toast, setToast] = useState<{ kind: ToastKind; msg: string } | null>(null);
  const [txFilter, setTxFilter] = useState("");
  /** Demo toggle: force all mock APIs to pass or fail */
  const [pathMode, setPathMode] = useState<MockPathMode>("auto");
  const [busy, setBusy] = useState<string | null>(null);

  // Send money form
  const [step, setStep] = useState(0);
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [fromAcct, setFromAcct] = useState(() => String(accounts.find((a) => a.status === "Active")?.title || ""));
  const [otp, setOtp] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [forceFail, setForceFail] = useState(false);

  // Beneficiary form
  const [benName, setBenName] = useState("");
  const [benUpi, setBenUpi] = useState("");
  const [benErrors, setBenErrors] = useState<Record<string, string>>({});

  // Bill / UPI
  const [upiId, setUpiId] = useState("");
  const [upiAmt, setUpiAmt] = useState("");
  const [upiErrors, setUpiErrors] = useState<Record<string, string>>({});

  // Support case form
  const [caseSubject, setCaseSubject] = useState("");
  const [caseCategory, setCaseCategory] = useState("Payments");
  const [caseBody, setCaseBody] = useState("");
  const [casePriority, setCasePriority] = useState("Normal");
  const [caseErrors, setCaseErrors] = useState<Record<string, string>>({});

  const totalBalance = useMemo(
    () =>
      accounts
        .filter((a) => String(a.status) === "Active")
        .reduce((s, a) => s + (Number(a.amount) || 0), 0),
    [accounts]
  );

  const visibleModules = MODULES.filter((m) =>
    roleMatches(roleId, role?.label || "", m.roles)
  );

  function flash(msg: string, kind: ToastKind = "success") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  }

  function validateTransfer(): boolean {
    const err: Record<string, string> = {};
    const name = payee.trim();
    const amt = Number(amount);
    if (!name) err.payee = "Payee name or UPI ID is required";
    else if (name.length < 2) err.payee = "Payee must be at least 2 characters";
    else if (/fail@|blocked@/i.test(name)) err.payee = "This payee is blocked (negative test)";

    if (!amount.trim()) err.amount = "Amount is required";
    else if (Number.isNaN(amt) || amt <= 0) err.amount = "Enter a valid amount greater than 0";
    else if (amt < 1) err.amount = "Minimum transfer is ₹1";
    else if (amt > limits.dailyTransfer) err.amount = `Exceeds daily limit ${inr(limits.dailyTransfer)}`;
    else if (amt > 200000) err.amount = "Single transfer cannot exceed ₹2,00,000 in this demo";

    const src = accounts.find((a) => String(a.title) === fromAcct);
    if (!src) err.from = "Select a source account";
    else if (String(src.status) !== "Active") err.from = "Source account is not Active (frozen/closed)";
    else if (amt > (Number(src.amount) || 0)) {
      err.amount = `Insufficient balance. Available ${inr(src.amount)}`;
    }

    if (note.length > 40) err.note = "Note max 40 characters";

    setFieldErrors(err);
    if (Object.keys(err).length) {
      flash(Object.values(err)[0], "error");
      return false;
    }
    return true;
  }

  function goReview() {
    if (!validateTransfer()) return;
    setStep(1);
    flash("Details look good — review and confirm", "info");
  }

  function goOtp() {
    if (!validateTransfer()) return;
    setStep(2);
    setOtp("");
    flash("Enter demo OTP 123456 to complete (or 000000 to fail)", "info");
  }

  async function completeTransfer() {
    if (!validateTransfer()) return;
    if (otp.trim() !== "123456" && otp.trim() !== "000000" && pathMode === "auto") {
      setFieldErrors({ otp: "Invalid OTP. Use 123456 (pass) or 000000 (fail demo)." });
      flash("Invalid OTP — transfer not completed", "error");
      return;
    }

    const amt = Number(amount);
    const payeeName = payee.trim();
    setBusy("transfer");
    const res = await mockApiCall({
      endpoint: "POST /mock/transfers",
      mode: pathMode,
      payload: { payee: payeeName, amount: amt, otp, forceFail },
      shouldFail: () =>
        otp.trim() === "000000" || forceFail || /fail@|blocked@/i.test(payeeName),
      failMessage: "Transfer failed: bank declined or authentication rejected",
      failCode: "TRANSFER_DECLINED",
      successMessage: `Success: ${inr(amt)} sent to ${payeeName}`,
      onSuccess: () => {
        setAccounts((prev) =>
          prev.map((a) =>
            String(a.title) === fromAcct
              ? { ...a, amount: Math.max(0, (Number(a.amount) || 0) - amt) }
              : a
          )
        );
        setTransfers((prev) => [
          {
            id: uid("tx"),
            title: payeeName,
            amount: amt,
            description: note || "Transfer",
            plan: fromAcct,
            status: "Completed",
            channel: "IMPS",
          },
          ...prev,
        ]);
        setNotifications((prev) => [
          {
            id: uid("n"),
            title: `Sent ${inr(amt)} to ${payeeName}`,
            status: "Unread",
            description: "IMPS success",
          },
          ...prev,
        ]);
        return { id: "ok" };
      },
    });
    setBusy(null);
    if (!res.ok) {
      setTransfers((prev) => [
        {
          id: uid("tf"),
          title: payeeName,
          amount: amt,
          description: note || "Transfer",
          plan: fromAcct,
          status: "Failed",
          channel: "IMPS",
        },
        ...prev,
      ]);
      flash(`${res.error} (${res.latencyMs}ms)`, "error");
      setStep(0);
      setForceFail(false);
      return;
    }
    setPayee("");
    setAmount("");
    setNote("");
    setOtp("");
    setStep(0);
    setFieldErrors({});
    setForceFail(false);
    setTab("transactions");
    flash(`${res.message} · mock ${res.latencyMs}ms`, "success");
  }

  async function payBill(id: string) {
    const bill = bills.find((b) => b.id === id);
    if (!bill) return;
    if (String(bill.status) === "Paid") {
      flash("Bill already paid", "info");
      return;
    }
    const amt = Number(bill.amount) || 0;
    const src = accounts.find(
      (a) => String(a.status) === "Active" && (Number(a.amount) || 0) >= amt
    );
    if (!src && pathMode !== "always_ok") {
      flash("Payment failed: insufficient balance across active accounts", "error");
      return;
    }
    setBusy(`bill-${id}`);
    const res = await mockApiCall({
      endpoint: "POST /mock/bills/pay",
      mode: pathMode,
      payload: { billId: id, title: bill.title, amount: amt },
      shouldFail: () => !src,
      failMessage: "Bill payment failed: insufficient funds or biller timeout",
      successMessage: `Bill paid: ${String(bill.title)} ${inr(amt)}`,
      onSuccess: () => {
        if (src) {
          setAccounts((prev) =>
            prev.map((a) =>
              a.id === src.id ? { ...a, amount: (Number(a.amount) || 0) - amt } : a
            )
          );
        }
        setBills((prev) => prev.map((b) => (b.id === id ? { ...b, status: "Paid" } : b)));
        setTransfers((prev) => [
          {
            id: uid("bill"),
            title: String(bill.title),
            amount: amt,
            description: "Bill payment",
            plan: String(src?.title || "—"),
            status: "Completed",
            channel: "Bill",
          },
          ...prev,
        ]);
        return true;
      },
    });
    setBusy(null);
    flash(
      res.ok ? `${res.message} · mock ${res.latencyMs}ms` : `${res.error} (${res.latencyMs}ms)`,
      res.ok ? "success" : "error"
    );
  }

  function addBeneficiary() {
    const err: Record<string, string> = {};
    if (!benName.trim()) err.name = "Name is required";
    if (!benUpi.trim()) err.upi = "UPI ID is required";
    else if (!/^[\w.-]+@[\w]+$/i.test(benUpi.trim())) {
      err.upi = "Invalid UPI format (e.g. name@okicici)";
    }
    setBenErrors(err);
    if (Object.keys(err).length) {
      flash(Object.values(err)[0], "error");
      return;
    }
    setBeneficiaries((prev) => [
      {
        id: uid("ben"),
        title: benName.trim(),
        upi: benUpi.trim(),
        account: "•••• new",
        status: "Pending",
      },
      ...prev,
    ]);
    setBenName("");
    setBenUpi("");
    setBenErrors({});
    flash("Payee added — pending verification (success)", "success");
  }

  async function sendUpi() {
    const err: Record<string, string> = {};
    const amt = Number(upiAmt);
    if (!upiId.trim()) err.upi = "UPI ID required";
    else if (!/^[\w.-]+@[\w]+$/i.test(upiId.trim()) && pathMode === "auto") {
      err.upi = "Invalid UPI ID";
    }
    if (!upiAmt.trim() || Number.isNaN(amt) || amt <= 0) err.amount = "Valid amount required";
    else if (amt > limits.upi) err.amount = `Exceeds UPI limit ${inr(limits.upi)}`;
    const wallet = accounts.find(
      (a) => /wallet/i.test(String(a.title)) || /wallet/i.test(String(a.level))
    );
    const src = wallet || accounts.find((a) => String(a.status) === "Active");
    if (src && amt > (Number(src.amount) || 0) && pathMode !== "always_ok") {
      err.amount = `Insufficient funds in ${String(src.title)}`;
    }
    setUpiErrors(err);
    if (Object.keys(err).length) {
      flash(Object.values(err)[0], "error");
      return;
    }
    setBusy("upi");
    const id = upiId.trim();
    const res = await mockApiCall({
      endpoint: "POST /mock/upi/pay",
      mode: pathMode,
      payload: { upiId: id, amount: amt },
      shouldFail: () => /fail@/i.test(id) || !src,
      failMessage: "UPI failed: payee bank declined (negative path)",
      successMessage: `UPI success: paid ${inr(amt)}`,
      onSuccess: () => {
        if (src) {
          setAccounts((prev) =>
            prev.map((a) =>
              a.id === src.id ? { ...a, amount: (Number(a.amount) || 0) - amt } : a
            )
          );
        }
        setTransfers((prev) => [
          {
            id: uid("upi"),
            title: id,
            amount: amt,
            description: "UPI pay",
            plan: String(src?.title || "Wallet"),
            status: "Completed",
            channel: "UPI",
          },
          ...prev,
        ]);
        return true;
      },
    });
    setBusy(null);
    if (!res.ok) {
      setTransfers((prev) => [
        {
          id: uid("upi"),
          title: id,
          amount: amt,
          description: "UPI",
          plan: String(src?.title || "Wallet"),
          status: "Failed",
          channel: "UPI",
        },
        ...prev,
      ]);
      flash(`${res.error} (${res.latencyMs}ms)`, "error");
      return;
    }
    setUpiId("");
    setUpiAmt("");
    setUpiErrors({});
    flash(`${res.message} · mock ${res.latencyMs}ms`, "success");
  }

  async function submitSupportCase() {
    const err: Record<string, string> = {};
    if (!caseSubject.trim()) err.subject = "Subject is required";
    else if (caseSubject.trim().length < 5) err.subject = "Subject must be at least 5 characters";
    if (!caseBody.trim()) err.body = "Please describe the issue";
    else if (caseBody.trim().length < 10) err.body = "Description too short (min 10 chars)";
    setCaseErrors(err);
    if (Object.keys(err).length) {
      flash(Object.values(err)[0], "error");
      return;
    }
    setBusy("support");
    const res = await mockApiCall({
      endpoint: "POST /mock/support/cases",
      mode: pathMode,
      payload: {
        subject: caseSubject,
        category: caseCategory,
        body: caseBody,
        priority: casePriority,
      },
      shouldFail: (p) => {
        const s = JSON.stringify(p).toLowerCase();
        return s.includes("fail") || s.includes("reject");
      },
      failMessage:
        "Support case rejected: ticketing system unavailable or policy block (try without word “fail”)",
      successMessage: "Support case created successfully",
      onSuccess: () => {
        const row: Row = {
          id: uid("k"),
          title: caseSubject.trim(),
          description: `${caseCategory} · ${casePriority} · ${caseBody.trim()}`,
          status: "Open",
          memberName: role?.label || "Customer",
          category: caseCategory,
          priority: casePriority,
        };
        setCases((prev) => [row, ...prev]);
        setNotifications((prev) => [
          {
            id: uid("n"),
            title: `Case opened: ${caseSubject.trim()}`,
            status: "Unread",
            description: "Support will reply in demo",
          },
          ...prev,
        ]);
        return row;
      },
    });
    setBusy(null);
    if (!res.ok) {
      flash(`${res.error} (${res.latencyMs}ms)`, "error");
      return;
    }
    setCaseSubject("");
    setCaseBody("");
    setCaseCategory("Payments");
    setCasePriority("Normal");
    setCaseErrors({});
    flash(`${res.message} · mock ${res.latencyMs}ms · #${res.data.id}`, "success");
  }

  async function updateCaseStatus(id: string, status: string) {
    setBusy(`case-${id}`);
    const res = await mockApiCall({
      endpoint: `PATCH /mock/support/cases/${id}`,
      mode: pathMode,
      payload: { id, status },
      failMessage: "Could not update case status (mock failure)",
      successMessage: `Case updated → ${status}`,
      onSuccess: () => {
        setCases((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
        return true;
      },
    });
    setBusy(null);
    flash(
      res.ok ? `${res.message} · ${res.latencyMs}ms` : `${res.error} (${res.latencyMs}ms)`,
      res.ok ? "success" : "error"
    );
  }

  function freezeCard(id: string, status: string) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    flash(
      status === "Frozen" ? "Card frozen successfully" : "Card unfrozen successfully",
      "success"
    );
  }

  function updateCardLimit(id: string, limit: number) {
    if (limit < 1000 || limit > 200000) {
      flash("Limit must be between ₹1,000 and ₹2,00,000", "error");
      return;
    }
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, amount: limit } : c)));
    flash(`Card spend limit updated to ${inr(limit)}`, "success");
  }

  const filteredTx = transfers.filter((t) => {
    if (!txFilter.trim()) return true;
    const q = txFilter.toLowerCase();
    return (
      String(t.title).toLowerCase().includes(q) ||
      String(t.status).toLowerCase().includes(q) ||
      String(t.channel || "").toLowerCase().includes(q)
    );
  });

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-background text-foreground",
        fullScreen
          ? "h-full max-h-full flex-1"
          : "h-full min-h-[560px] max-h-[calc(100dvh-6rem)] rounded-xl border border-border"
      )}
    >
      <header className="shrink-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: spec.primaryColor }}
            >
              <Landmark className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold" style={{ color: spec.primaryColor }}>
                {spec.brandName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Mock APIs · happy & fail paths · {visibleModules.length} modules
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2 py-1 text-[11px]">
              <span className="text-muted-foreground">API path</span>
              <select
                value={pathMode}
                onChange={(e) => setPathMode(e.target.value as MockPathMode)}
                className="bg-transparent font-semibold outline-none"
                title="Force mock API success or failure for demos"
              >
                <option value="auto">Auto (realistic)</option>
                <option value="always_ok">Always success</option>
                <option value="always_fail">Always fail</option>
              </select>
            </label>
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
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto overscroll-x-contain border-t border-border/50 px-2 py-1.5 md:px-4 [scrollbar-width:thin]">
          {visibleModules.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setTab(m.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium whitespace-nowrap",
                tab === m.id
                  ? "bg-accent-teal/15 text-accent-teal"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </nav>
      </header>

      {toast && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm",
            toast.kind === "success" &&
              "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
            toast.kind === "error" &&
              "bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100",
            toast.kind === "info" &&
              "bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
          )}
        >
          {toast.kind === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {toast.kind === "error" && <XCircle className="h-4 w-4 shrink-0" />}
          {toast.kind === "info" && <AlertTriangle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <main
        className="mx-auto w-full max-w-7xl min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 py-5 md:px-5"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
          overflowY: "auto",
        }}
      >
        {busy && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-accent-teal/30 bg-accent-teal/10 px-3 py-2 text-xs text-accent-teal">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Calling mock API… ({busy})
          </div>
        )}
        {tab === "home" && (
          <div className="space-y-5">
            {spec.learning && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
                  Learning track · {role?.label}
                </p>
                <h1 className="text-2xl font-bold tracking-tight">{spec.learning.heroHeadline}</h1>
                <p className="max-w-3xl text-sm text-muted-foreground">{spec.learning.heroSub}</p>
                {spec.learning.outcomes.length > 0 && (
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {spec.learning.outcomes.slice(0, 4).map((o) => (
                      <li key={o} className="flex gap-2 text-sm text-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal" />
                        {o}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <Card
              className="overflow-hidden p-0 text-white"
              style={{
                background: `linear-gradient(135deg, ${spec.primaryColor}, #0d9488)`,
              }}
            >
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white/80">Total available</p>
                    <p className="mt-1 text-4xl font-bold tracking-tight md:text-5xl">
                      {hideBalance ? "••••••" : inr(totalBalance)}
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      {role?.label} · {accounts.filter((a) => a.status === "Active").length} active
                      accounts · demo only
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="bg-white/15 text-white hover:bg-white/25"
                    onClick={() => setHideBalance((v) => !v)}
                  >
                    {hideBalance ? "Show" : "Hide"} balance
                  </Button>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {(
                    [
                      ["send", "Send money"],
                      ["upi", "UPI pay"],
                      ["bills", "Pay bills"],
                      ["cards", "Cards"],
                      ["accounts", "Accounts"],
                    ] as const
                  ).map(([id, label]) => (
                    <Button
                      key={id}
                      type="button"
                      variant="secondary"
                      className="bg-white text-slate-900 hover:bg-white/90"
                      onClick={() => setTab(id)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {accounts.map((a) => (
                <Card key={a.id} className="p-4">
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold text-sm">{String(a.title)}</p>
                    <Badge className="bg-muted text-[10px]">{String(a.status)}</Badge>
                  </div>
                  <p className="mt-2 text-xl font-bold">
                    {hideBalance ? "••••" : inr(a.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{String(a.level)}</p>
                </Card>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Card className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Modules</p>
                <p className="mt-1 text-2xl font-bold text-accent-teal">{visibleModules.length}</p>
                <p className="text-xs text-muted-foreground">Full retail banking surface</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Pending</p>
                <p className="mt-1 text-2xl font-bold">
                  {transfers.filter((t) => /pending|2fa/i.test(String(t.status))).length}
                </p>
                <p className="text-xs text-muted-foreground">Transfers need action</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Unread alerts</p>
                <p className="mt-1 text-2xl font-bold">
                  {notifications.filter((n) => n.status === "Unread").length}
                </p>
                <button
                  type="button"
                  className="text-xs text-accent-teal underline"
                  onClick={() => setTab("notifications")}
                >
                  View alerts
                </button>
              </Card>
            </div>
          </div>
        )}

        {tab === "accounts" && (
          <Module title="Accounts" hint="View balances, IFSC, freeze state">
            {accounts.map((a) => (
              <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{String(a.title)}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(a.level)} · IFSC {String(a.ifsc || "HZBN0001234")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{inr(a.amount)}</p>
                  <Badge className="bg-muted">{String(a.status)}</Badge>
                </div>
              </Card>
            ))}
          </Module>
        )}

        {tab === "send" && (
          <Card className="mx-auto max-w-lg space-y-4 p-6">
            <h2 className="text-xl font-semibold">Send money</h2>
            <p className="text-xs text-muted-foreground">
              Validation + OTP pass (123456) / fail (000000). Insufficient balance blocked.
            </p>
            <Steps step={step} labels={["Details", "Review", "2FA OTP"]} />

            {step === 0 && (
              <>
                <Field label="Payee name / UPI" error={fieldErrors.payee}>
                  <Input
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    placeholder="Asha or name@upi"
                  />
                </Field>
                <Field label="Amount (₹)" error={fieldErrors.amount}>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1500"
                  />
                </Field>
                <Field label="From account" error={fieldErrors.from}>
                  <select
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={fromAcct}
                    onChange={(e) => setFromAcct(e.target.value)}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={String(a.title)}>
                        {String(a.title)} ({inr(a.amount)}) — {String(a.status)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Note (optional)" error={fieldErrors.note}>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Max 40 chars"
                    maxLength={50}
                  />
                </Field>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={forceFail}
                    onChange={(e) => setForceFail(e.target.checked)}
                  />
                  Force failure after OTP (negative test)
                </label>
                <Button type="button" variant="cta" onClick={goReview}>
                  Continue
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
                  <p>
                    <strong>To:</strong> {payee}
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
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button type="button" variant="cta" onClick={goOtp}>
                    Confirm → OTP
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="One-time password" error={fieldErrors.otp}>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456 pass · 000000 fail"
                    inputMode="numeric"
                  />
                </Field>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="cta"
                    disabled={busy === "transfer"}
                    onClick={() => void completeTransfer()}
                  >
                    {busy === "transfer" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Complete transfer
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {tab === "upi" && (
          <Card className="mx-auto max-w-lg space-y-4 p-6">
            <h2 className="text-xl font-semibold">UPI pay</h2>
            <p className="text-xs text-muted-foreground">
              Use fail@okicici as UPI ID to simulate bank decline.
            </p>
            <Field label="UPI ID" error={upiErrors.upi}>
              <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@okicici" />
            </Field>
            <Field label="Amount" error={upiErrors.amount}>
              <Input type="number" value={upiAmt} onChange={(e) => setUpiAmt(e.target.value)} />
            </Field>
            <Button
              type="button"
              variant="cta"
              disabled={busy === "upi"}
              onClick={() => void sendUpi()}
            >
              {busy === "upi" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Pay via UPI
            </Button>
          </Card>
        )}

        {tab === "beneficiaries" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3 p-5">
              <h2 className="font-semibold">Add payee</h2>
              <Field label="Name" error={benErrors.name}>
                <Input value={benName} onChange={(e) => setBenName(e.target.value)} />
              </Field>
              <Field label="UPI ID" error={benErrors.upi}>
                <Input value={benUpi} onChange={(e) => setBenUpi(e.target.value)} placeholder="name@ybl" />
              </Field>
              <Button type="button" variant="cta" onClick={addBeneficiary}>
                Add payee
              </Button>
            </Card>
            <div className="space-y-2">
              {beneficiaries.map((b) => (
                <Card key={b.id} className="flex justify-between p-3">
                  <div>
                    <p className="font-medium">{String(b.title)}</p>
                    <p className="text-xs text-muted-foreground">{String(b.upi)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-muted">{String(b.status)}</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setPayee(String(b.upi || b.title));
                        setTab("send");
                        flash("Payee loaded into Send money", "info");
                      }}
                    >
                      Pay
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === "bills" && (
          <Module title="Bill payments" hint="Pay due bills; insufficient balance fails">
            {bills.map((b) => (
              <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{String(b.title)}</p>
                  <p className="text-xs text-muted-foreground">Due {String(b.due)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{inr(b.amount)}</p>
                  <Badge className="bg-muted">{String(b.status)}</Badge>
                  {String(b.status) !== "Paid" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="cta"
                      disabled={busy === `bill-${b.id}`}
                      onClick={() => void payBill(b.id)}
                    >
                      {busy === `bill-${b.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      Pay now
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </Module>
        )}

        {tab === "cards" && (
          <Module title="Cards" hint="Freeze / unfreeze + change spend limits with validation">
            {cards.map((c) => (
              <Card key={c.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-20 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                      style={{ background: spec.primaryColor }}
                    >
                      {String(c.level)}
                    </div>
                    <div>
                      <p className="font-semibold">{String(c.title)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(c.description)} · limit {inr(c.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-muted">{String(c.status)}</Badge>
                    {String(c.status) === "Active" ? (
                      <Button type="button" size="sm" variant="secondary" onClick={() => freezeCard(c.id, "Frozen")}>
                        Freeze
                      </Button>
                    ) : (
                      <Button type="button" size="sm" variant="cta" onClick={() => freezeCard(c.id, "Active")}>
                        Unfreeze
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-xs">
                    New limit (₹)
                    <Input
                      type="number"
                      className="mt-1 w-36"
                      defaultValue={String(c.amount || 15000)}
                      id={`lim-${c.id}`}
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const el = document.getElementById(`lim-${c.id}`) as HTMLInputElement | null;
                      updateCardLimit(c.id, Number(el?.value || 0));
                    }}
                  >
                    Update limit
                  </Button>
                </div>
              </Card>
            ))}
          </Module>
        )}

        {tab === "transactions" && (
          <Module title="Transactions">
            <Input
              className="mb-3 max-w-sm"
              placeholder="Filter by name, status, channel…"
              value={txFilter}
              onChange={(e) => setTxFilter(e.target.value)}
            />
            {filteredTx.length === 0 && (
              <p className="text-sm text-muted-foreground">No transactions match your filter.</p>
            )}
            {filteredTx.map((t) => (
              <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div>
                  <p className="font-medium">{String(t.title)}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(t.description || "")} · {String(t.channel || "IMPS")} ·{" "}
                    {String(t.plan || "")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{inr(t.amount)}</p>
                  <StatusBadge status={String(t.status)} />
                </div>
              </Card>
            ))}
          </Module>
        )}

        {tab === "statements" && (
          <Module title="Statements" hint="Download is demo — success message only">
            {["Mar 2026", "Feb 2026", "Jan 2026", "Dec 2025"].map((m) => (
              <Card key={m} className="flex items-center justify-between p-4">
                <p className="font-medium">{m} statement (PDF)</p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => flash(`${m} statement download started (demo success)`, "success")}
                >
                  Download
                </Button>
              </Card>
            ))}
          </Module>
        )}

        {tab === "insights" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Spend insights</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { cat: "Food", pct: 28, amt: 12400 },
                { cat: "Rent", pct: 40, amt: 25000 },
                { cat: "Travel", pct: 12, amt: 5200 },
                { cat: "Shopping", pct: 15, amt: 6800 },
                { cat: "Bills", pct: 5, amt: 2100 },
              ].map((c) => (
                <Card key={c.cat} className="p-4">
                  <p className="text-sm font-semibold">{c.cat}</p>
                  <p className="text-lg font-bold">{inr(c.amt)}</p>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-accent-teal"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.pct}% of spend</p>
                </Card>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => flash("Budget alert set: Food &lt; ₹15,000/mo (demo)", "success")}
            >
              Set budget alert
            </Button>
          </div>
        )}

        {tab === "deposits" && (
          <Module title="Deposits (FD / RD)">
            {deposits.map((d) => (
              <Card key={d.id} className="flex flex-wrap justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{String(d.title)}</p>
                  <p className="text-xs text-muted-foreground">
                    Rate {String(d.rate)} · Matures {String(d.maturity)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{inr(d.amount)}</p>
                  <Badge className="bg-muted">{String(d.status)}</Badge>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="cta"
              onClick={() => {
                setDeposits((prev) => [
                  {
                    id: uid("d"),
                    title: "New FD 6 months",
                    amount: 25000,
                    rate: "6.8%",
                    status: "Active",
                    maturity: "Oct 2026",
                  },
                  ...prev,
                ]);
                flash("FD booked successfully (demo)", "success");
              }}
            >
              Book new FD ₹25,000
            </Button>
          </Module>
        )}

        {tab === "loans" && (
          <Module title="Loans & EMI">
            {loans.map((l) => (
              <Card key={l.id} className="flex flex-wrap justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{String(l.title)}</p>
                  <p className="text-xs text-muted-foreground">
                    EMI {inr(l.emi)} · Next due {String(l.due)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{inr(l.amount)}</p>
                  <Badge className="bg-muted">{String(l.status)}</Badge>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const loan = loans.find((l) => l.status === "Active");
                if (!loan) {
                  flash("No active loan EMI to pay", "error");
                  return;
                }
                const emi = Number(loan.emi) || 0;
                const src = accounts.find(
                  (a) => String(a.status) === "Active" && (Number(a.amount) || 0) >= emi
                );
                if (!src) {
                  flash("EMI payment failed: insufficient balance", "error");
                  return;
                }
                setAccounts((prev) =>
                  prev.map((a) =>
                    a.id === src.id ? { ...a, amount: (Number(a.amount) || 0) - emi } : a
                  )
                );
                flash(`EMI ${inr(emi)} paid successfully`, "success");
              }}
            >
              Pay next EMI
            </Button>
          </Module>
        )}

        {tab === "scheduled" && (
          <Module title="Scheduled payments">
            {scheduled.map((s) => (
              <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{String(s.title)}</p>
                  <p className="text-xs text-muted-foreground">{String(s.when)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{inr(s.amount)}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setScheduled((prev) =>
                        prev.map((x) =>
                          x.id === s.id
                            ? {
                                ...x,
                                status: x.status === "Active" ? "Paused" : "Active",
                              }
                            : x
                        )
                      );
                      flash(
                        `Standing order ${String(s.status) === "Active" ? "paused" : "resumed"}`,
                        "success"
                      );
                    }}
                  >
                    {String(s.status) === "Active" ? "Pause" : "Resume"}
                  </Button>
                </div>
              </Card>
            ))}
          </Module>
        )}

        {tab === "limits" && (
          <Card className="mx-auto max-w-lg space-y-4 p-6">
            <h2 className="text-xl font-semibold">Payment limits</h2>
            {(
              [
                ["dailyTransfer", "Daily transfer limit"],
                ["upi", "UPI limit"],
                ["cardPos", "Card POS limit"],
                ["cardOnline", "Card online limit"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={`${label} (₹)`}>
                <Input
                  type="number"
                  value={String(limits[key])}
                  onChange={(e) =>
                    setLimits((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))
                  }
                />
              </Field>
            ))}
            <Button
              type="button"
              variant="cta"
              onClick={() => {
                if (limits.dailyTransfer < 1000 || limits.upi < 100) {
                  flash("Limits too low — daily ≥ ₹1,000, UPI ≥ ₹100", "error");
                  return;
                }
                flash("Limits saved successfully", "success");
              }}
            >
              Save limits
            </Button>
          </Card>
        )}

        {tab === "kyc" && (
          <Card className="mx-auto max-w-lg space-y-3 p-6">
            <h2 className="text-xl font-semibold">KYC & profile</h2>
            <p className="text-sm">
              Status: <Badge className="bg-muted">{kyc.status}</Badge>
            </p>
            <p className="text-sm">
              <strong>PAN:</strong> {kyc.pan}
            </p>
            <p className="text-sm">
              <strong>Aadhaar:</strong> {kyc.aadhaar}
            </p>
            <Field label="Address">
              <Input
                value={kyc.address}
                onChange={(e) => setKyc((p) => ({ ...p, address: e.target.value }))}
              />
            </Field>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="cta"
                onClick={() => {
                  if (kyc.address.trim().length < 8) {
                    flash("Address too short for KYC update", "error");
                    return;
                  }
                  setKyc((p) => ({ ...p, status: "Verified" }));
                  flash("Profile updated — KYC remains Verified", "success");
                }}
              >
                Save profile
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setKyc((p) => ({ ...p, status: "Re-KYC required" }));
                  flash("Re-KYC requested — upload docs in a full build", "info");
                }}
              >
                Request re-KYC
              </Button>
            </div>
          </Card>
        )}

        {tab === "security" && (
          <Card className="mx-auto max-w-lg space-y-4 p-6">
            <h2 className="text-xl font-semibold">Security</h2>
            <Toggle
              label="Two-factor authentication"
              on={security.twoFa}
              onChange={(v) => {
                setSecurity((p) => ({ ...p, twoFa: v }));
                flash(v ? "2FA enabled" : "2FA disabled — less secure", v ? "success" : "error");
              }}
            />
            <Toggle
              label="Biometric login"
              on={security.biometric}
              onChange={(v) => {
                setSecurity((p) => ({ ...p, biometric: v }));
                flash(v ? "Biometric on" : "Biometric off", "info");
              }}
            />
            <p className="text-sm text-muted-foreground">
              Trusted devices: {security.devices}
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSecurity((p) => ({ ...p, devices: 1 }));
                flash("Signed out other devices successfully", "success");
              }}
            >
              Sign out other devices
            </Button>
          </Card>
        )}

        {tab === "notifications" && (
          <Module title="Alerts">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className="flex cursor-pointer justify-between gap-3 p-3"
                onClick={() => {
                  setNotifications((prev) =>
                    prev.map((x) => (x.id === n.id ? { ...x, status: "Read" } : x))
                  );
                }}
              >
                <div>
                  <p className="font-medium">{String(n.title)}</p>
                  <p className="text-xs text-muted-foreground">{String(n.description)}</p>
                </div>
                <Badge className="bg-muted">{String(n.status)}</Badge>
              </Card>
            ))}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, status: "Read" })));
                flash("All alerts marked read", "success");
              }}
            >
              Mark all read
            </Button>
          </Module>
        )}

        {tab === "disputes" && (
          <Module title="Disputes" hint="Raise dispute on unknown charges">
            {disputes.map((d) => (
              <Card key={d.id} className="flex justify-between p-4">
                <div>
                  <p className="font-semibold">{String(d.title)}</p>
                  <p className="text-xs text-muted-foreground">{String(d.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{inr(d.amount)}</p>
                  <Badge className="bg-muted">{String(d.status)}</Badge>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="cta"
              onClick={() => {
                setDisputes((prev) => [
                  {
                    id: uid("dp"),
                    title: "Disputed card charge",
                    amount: 999,
                    status: "Open",
                    date: "Today",
                  },
                  ...prev,
                ]);
                flash("Dispute raised successfully — case #demo", "success");
              }}
            >
              Raise new dispute
            </Button>
          </Module>
        )}

        {tab === "support" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3 p-5">
              <h2 className="text-lg font-semibold">Raise support case</h2>
              <p className="text-xs text-muted-foreground">
                Mock API <code className="rounded bg-muted px-1">POST /mock/support/cases</code>.
                Type <strong>fail</strong> in subject to force failure (or set API path → Always fail).
              </p>
              <Field label="Subject" error={caseErrors.subject}>
                <Input
                  value={caseSubject}
                  onChange={(e) => setCaseSubject(e.target.value)}
                  placeholder="e.g. Transfer stuck Pending"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Category">
                  <select
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={caseCategory}
                    onChange={(e) => setCaseCategory(e.target.value)}
                  >
                    {["Payments", "Cards", "KYC", "Login", "Other"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={casePriority}
                    onChange={(e) => setCasePriority(e.target.value)}
                  >
                    {["Low", "Normal", "High", "Urgent"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Description" error={caseErrors.body}>
                <textarea
                  className="mt-1 min-h-[100px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={caseBody}
                  onChange={(e) => setCaseBody(e.target.value)}
                  placeholder="What went wrong? Include amount, time, UPI if any."
                />
              </Field>
              <Button
                type="button"
                variant="cta"
                disabled={busy === "support"}
                onClick={() => void submitSupportCase()}
              >
                {busy === "support" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Submit case (mock API)
              </Button>
            </Card>
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Your cases</h2>
              {cases.length === 0 && (
                <p className="text-sm text-muted-foreground">No cases yet — submit one on the left.</p>
              )}
              {cases.map((c) => (
                <Card key={c.id} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{String(c.title)}</p>
                      <p className="text-xs text-muted-foreground">{String(c.description)}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        id {c.id} · {String(c.memberName || "")}
                      </p>
                    </div>
                    <StatusBadge status={String(c.status)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                      value={String(c.status)}
                      disabled={Boolean(busy?.startsWith("case-"))}
                      onChange={(e) => void updateCaseStatus(c.id, e.target.value)}
                    >
                      {["Open", "In progress", "Resolved", "Closed"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    {busy === `case-${c.id}` && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === "ops" && (
          <Module title="Ops / risk queue" hint="Clear Pending & 2FA transfers">
            {transfers
              .filter((t) => /pending|2fa|failed/i.test(String(t.status)))
              .map((t) => (
                <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{String(t.title)}</p>
                    <p className="text-xs text-muted-foreground">
                      {inr(t.amount)} · {String(t.status)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="cta"
                      disabled={busy === `ops-${t.id}`}
                      onClick={() => {
                        void (async () => {
                          setBusy(`ops-${t.id}`);
                          const res = await mockApiCall({
                            endpoint: `POST /mock/ops/transfers/${t.id}/approve`,
                            mode: pathMode,
                            payload: { id: t.id, action: "approve" },
                            successMessage: "Ops approved transfer",
                            failMessage: "Ops approve failed (mock)",
                            onSuccess: () => {
                              setTransfers((prev) =>
                                prev.map((x) =>
                                  x.id === t.id ? { ...x, status: "Completed" } : x
                                )
                              );
                              return true;
                            },
                          });
                          setBusy(null);
                          flash(
                            res.ok
                              ? `${res.message} · ${res.latencyMs}ms`
                              : `${res.error} (${res.latencyMs}ms)`,
                            res.ok ? "success" : "error"
                          );
                        })();
                      }}
                    >
                      {busy === `ops-${t.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy === `ops-r-${t.id}`}
                      onClick={() => {
                        void (async () => {
                          setBusy(`ops-r-${t.id}`);
                          const res = await mockApiCall({
                            endpoint: `POST /mock/ops/transfers/${t.id}/reject`,
                            mode: pathMode,
                            payload: { id: t.id, action: "reject" },
                            successMessage: "Ops rejected transfer",
                            failMessage: "Ops reject failed (mock)",
                            onSuccess: () => {
                              setTransfers((prev) =>
                                prev.map((x) =>
                                  x.id === t.id ? { ...x, status: "Failed" } : x
                                )
                              );
                              return true;
                            },
                          });
                          setBusy(null);
                          flash(
                            res.ok
                              ? `${res.message} · ${res.latencyMs}ms`
                              : `${res.error} (${res.latencyMs}ms)`,
                            res.ok ? "error" : "error"
                          );
                        })();
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              ))}
            {transfers.filter((t) => /pending|2fa|failed/i.test(String(t.status))).length ===
              0 && (
              <p className="text-sm text-muted-foreground">Queue empty — all clear.</p>
            )}
          </Module>
        )}
      </main>

      <footer className="border-t border-border px-4 py-2 text-center text-[10px] text-muted-foreground">
        {spec.brandName} · Fictional demo bank · Not a real financial product ·{" "}
        {visibleModules.length} modules
      </footer>
    </div>
  );
}

function Module({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}

function Steps({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs font-medium">
      {labels.map((label, i) => (
        <span
          key={label}
          className={cn(
            "rounded-full px-2.5 py-1",
            step === i
              ? "bg-accent-teal/15 text-accent-teal"
              : step > i
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                : "bg-muted text-muted-foreground"
          )}
        >
          {i + 1}. {label}
        </span>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "completed" || s === "paid" || s === "verified" || s === "active"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
      : s === "failed" || s === "blocked"
        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
        : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100";
  return <Badge className={cn("text-[10px]", cls)}>{status}</Badge>;
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn(
          "relative h-7 w-12 rounded-full transition",
          on ? "bg-accent-teal" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
            on ? "left-5" : "left-0.5"
          )}
        />
      </button>
    </label>
  );
}
