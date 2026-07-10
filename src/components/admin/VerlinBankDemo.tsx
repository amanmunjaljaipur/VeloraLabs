"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  ShieldAlert,
  DollarSign,
  Send,
  TrendingUp,
  Bot,
  CreditCard,
  User,
  Lock,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Moon,
  Sun,
  ArrowRight,
  ChevronRight,
  Wifi,
  Battery,
  Terminal,
  Settings,
  Plus,
  Minus,
  Info,
  Percent,
  MapPin,
  ChevronLeft,
  Bell,
  Fingerprint,
  RotateCcw,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock User Types & Details
type RoleType = "ROLE_RETAIL_USER" | "ROLE_PREMIUM_WEALTH" | "ROLE_SUPPORT_ADMIN";

interface Transaction {
  id: string;
  date: string;
  payee: string;
  amount: number;
  category: string;
  aiConfidenceScore: number;
}

interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  latency: number;
  requestBody: any;
  responseBody: any;
}

export function VerlinBankDemo() {
  // Global App States
  const [activeRole, setActiveRole] = useState<RoleType>("ROLE_PREMIUM_WEALTH");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isMfaRequired, setIsMfaRequired] = useState<boolean>(false);
  const [mfaCode, setMfaCode] = useState<string>("");
  const [activeScreen, setActiveScreen] = useState<string>("login"); // login, dashboard, ledger, transfer, chat, cards, profile
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Financial States
  const [balances, setBalances] = useState({
    checking: 4120.50,
    savings: 10000.00,
    investment: 75000.00
  });
  const [isBalancesVisible, setIsBalancesVisible] = useState<boolean>(true);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [onlineEnabled, setOnlineEnabled] = useState<boolean>(true);
  const [intlEnabled, setIntlEnabled] = useState<boolean>(false);
  const [dailyLimit, setDailyLimit] = useState<number>(1500);
  const [dailySpent, setDailySpent] = useState<number>(0);

  // Form & Interaction States
  const [loginEmail, setLoginEmail] = useState<string>("jane.doe@verlinbank.com");
  const [loginPassword, setLoginPassword] = useState<string>("Password123!");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [telemetryRisk, setTelemetryRisk] = useState<"LOW" | "HIGH">("LOW");
  
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferRecipient, setTransferRecipient] = useState<string>("REC-8821"); // Sarah Jenkins
  const [transferSource, setTransferSource] = useState<string>("ACC-4321"); // Checking
  const [transferError, setTransferError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai", text: string, action?: any }>>([
    { sender: "ai", text: "Hello Jane! I am your Verlin Bank AI Assistant. How can I help you manage your funds today?" }
  ]);

  // Settings & Preferences
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(true);
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState<boolean>(true);

  // Debug Console & Operator States
  const [latencyMode, setLatencyMode] = useState<boolean>(true);
  const [inject500, setInject500] = useState<boolean>(false);
  const [inject422, setInject422] = useState<boolean>(false);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [activeTab, setActiveTab] = useState<"logs" | "agents" | "editor">("logs");

  // Transaction Ledger Database
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "TXN-901", date: "2026-07-10", payee: "Organic Market", amount: -82.40, category: "Food", aiConfidenceScore: 0.98 },
    { id: "TXN-902", date: "2026-07-09", payee: "Starbucks Coffee", amount: -12.50, category: "Food", aiConfidenceScore: 0.99 },
    { id: "TXN-903", date: "2026-07-08", payee: "AWS Cloud Services", amount: -450.00, category: "Tech", aiConfidenceScore: 0.95 },
    { id: "TXN-904", date: "2026-07-07", payee: "Payroll Deposit", amount: 3200.00, category: "Income", aiConfidenceScore: 0.99 },
  ]);

  // Recipient Database
  const recipients = [
    { id: "REC-8821", name: "Sarah Jenkins", email: "sarah.j@gmail.com", avatar: "S" },
    { id: "REC-4911", name: "David Miller", email: "david.m@yahoo.com", avatar: "D" },
    { id: "REC-0099", name: "Electricity Corp", email: "billing@electric.com", avatar: "E" },
  ];

  // Logs ref to autoscroll
  const logTerminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [apiLogs]);

  // Helper: Log simulated API interactions
  const logApiCall = (method: string, url: string, request: any, response: any, status: number, latency: number) => {
    const newLog: ApiLog = {
      id: `LOG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toLocaleTimeString(),
      method,
      url,
      status,
      latency,
      requestBody: request,
      responseBody: response
    };
    setApiLogs(prev => [...prev, newLog]);
  };

  // Simulated API Handler
  const makeApiCall = async (method: string, url: string, body?: any): Promise<any> => {
    setIsLoading(true);
    const latency = latencyMode ? Math.floor(Math.random() * 450) + 150 : 50;
    await new Promise(resolve => setTimeout(resolve, latency));

    if (inject500) {
      const errorMsg = { status: "ERROR", message: "Simulated 500 Internal Server Error" };
      logApiCall(method, url, body, errorMsg, 500, latency);
      setIsLoading(false);
      throw new Error("500 Internal Server Error");
    }

    if (inject422) {
      const errorMsg = { status: "UNPROCESSABLE", message: "Simulated 422 Validation Error - Invalid Telemetry or Limits" };
      logApiCall(method, url, body, errorMsg, 422, latency);
      setIsLoading(false);
      throw new Error("422 Validation Error");
    }

    setIsLoading(false);
    return latency;
  };

  // Workflow 1: Authentication & MFA
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const reqBody = {
        username: loginEmail,
        password: loginPassword,
        telemetry: {
          ip: telemetryRisk === "HIGH" ? "198.51.100.45" : "192.168.1.52",
          gps: telemetryRisk === "HIGH" ? "55.7558, 37.6173" : "26.9124, 75.7873"
        }
      };

      const latency = await makeApiCall("POST", "/api/v1/auth/login", reqBody);

      if (telemetryRisk === "HIGH") {
        setIsMfaRequired(true);
        const resBody = { status: "MFA_REQUIRED", message: "High-risk location flagged. OTP verification sent." };
        logApiCall("POST", "/api/v1/auth/login", reqBody, resBody, 200, latency);
      } else {
        setIsLoggedIn(true);
        setActiveScreen("dashboard");
        const resBody = {
          status: "SUCCESS",
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.jane-doe-token",
          user: { firstName: "Jane", activeRole, riskFlag: "LOW" }
        };
        logApiCall("POST", "/api/v1/auth/login", reqBody, resBody, 200, latency);
      }
    } catch (err: any) {
      // API call failed, handled inside logs and UI
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const reqBody = { code: mfaCode };
      const latency = await makeApiCall("POST", "/api/v1/auth/verify-mfa", reqBody);

      if (mfaCode === "123456") {
        setIsLoggedIn(true);
        setIsMfaRequired(false);
        setActiveScreen("dashboard");
        const resBody = {
          status: "SUCCESS",
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.jane-doe-token",
          user: { firstName: "Jane", activeRole, riskFlag: "PASSED_MFA" }
        };
        logApiCall("POST", "/api/v1/auth/verify-mfa", reqBody, resBody, 200, latency);
      } else {
        const errorMsg = { status: "UNAUTHORIZED", message: "Invalid verification code" };
        logApiCall("POST", "/api/v1/auth/verify-mfa", reqBody, errorMsg, 401, latency);
        alert("Invalid code! Try: 123456");
      }
    } catch (err) {
      // Intercepted by simulator settings
    }
  };

  // Workflow 2: P2P Money Transfer
  const handleExecuteTransfer = async (amountVal?: number, customRecipient?: string) => {
    setTransferError(null);
    const amount = amountVal || parseFloat(transferAmount);
    const recipientId = customRecipient || transferRecipient;

    if (isNaN(amount) || amount <= 0) {
      setTransferError("Please enter a valid transfer amount.");
      return;
    }

    // Role Bound Checks
    const limit = activeRole === "ROLE_RETAIL_USER" ? 5000 : 50000;
    if (amount > limit) {
      const errMsg = `Transaction exceeds your standard daily account limit of $${limit.toLocaleString()}.`;
      setTransferError(errMsg);
      logApiCall("POST", "/api/v1/transfers/execute", { amount, recipientId }, { error: "LIMIT_EXCEEDED", message: errMsg }, 403, 50);
      return;
    }

    // Card Frozen Check
    if (isFrozen) {
      const errMsg = "Transaction blocked: Your card is currently frozen.";
      setTransferError(errMsg);
      logApiCall("POST", "/api/v1/transfers/execute", { amount, recipientId }, { error: "CARD_FROZEN", message: errMsg }, 403, 50);
      return;
    }

    try {
      const reqBody = {
        sourceAccountId: transferSource,
        destinationId: recipientId,
        amount
      };

      const latency = await makeApiCall("POST", "/api/v1/transfers/execute", reqBody);

      // Execute local balance reduction and transaction registration
      const newChecking = balances.checking - amount;
      const targetRecipient = recipients.find(r => r.id === recipientId)?.name || recipientId;

      setBalances(prev => ({
        ...prev,
        checking: newChecking
      }));
      setDailySpent(prev => prev + amount);

      const newTx: Transaction = {
        id: `TXN-${Math.floor(Math.random() * 90000) + 10000}`,
        date: new Date().toISOString().split("T")[0],
        payee: targetRecipient,
        amount: -amount,
        category: "Transfer",
        aiConfidenceScore: 0.99
      };

      setTransactions(prev => [newTx, ...prev]);

      const resBody = {
        status: "COMPLETED",
        transactionId: newTx.id,
        newSourceBalance: newChecking
      };

      logApiCall("POST", "/api/v1/transfers/execute", reqBody, resBody, 200, latency);
      
      // Clean up forms & navigate back
      setTransferAmount("");
      setActiveScreen("dashboard");
    } catch (err) {
      // Handled by network simulator checks
    }
  };

  // Workflow 3: Conversational AI to Autonomous Execution
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");

    try {
      const reqBody = { message: userText };
      const latency = await makeApiCall("POST", "/api/v1/ai/chat", reqBody);

      let aiResponseText = "";
      let suggestedActionObj = null;

      // Parsing keywords for mock intent resolution
      if (userText.toLowerCase().includes("move") && userText.toLowerCase().includes("savings")) {
        // Extract amount if any
        const match = userText.match(/\d+/);
        const amount = match ? parseInt(match[0]) : 100;
        aiResponseText = `I detected you want to move $${amount} to your savings account. Please review and confirm the transfer details below:`;
        suggestedActionObj = {
          type: "ACCOUNT_TRANSFER",
          params: { amount, from: "Checking", to: "Savings" }
        };
      } else if (userText.toLowerCase().includes("freeze")) {
        aiResponseText = "I can freeze your debit card for security purposes. Would you like to proceed?";
        suggestedActionObj = {
          type: "FREEZE_CARD",
          params: {}
        };
      } else {
        aiResponseText = `I analyzed your request. As a ${activeRole === "ROLE_PREMIUM_WEALTH" ? "Premium Wealth" : "Retail"} member, I suggest optimization. Let me know if you would like me to process a payment, evaluate cashflow trajectories, or sweep idle balances.`;
      }

      const resBody = {
        agentMessage: aiResponseText,
        actionRequired: !!suggestedActionObj,
        suggestedAction: suggestedActionObj
      };

      logApiCall("POST", "/api/v1/ai/chat", reqBody, resBody, 200, latency);

      setChatMessages(prev => [...prev, { sender: "ai", text: aiResponseText, action: suggestedActionObj }]);
    } catch (err) {
      // Intercepted
    }
  };

  // Confirming Conversational Transfer
  const handleConfirmAiAction = async (action: any) => {
    if (action.type === "ACCOUNT_TRANSFER") {
      const amount = action.params.amount;
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setBalances(prev => ({
        ...prev,
        checking: prev.checking - amount,
        savings: prev.savings + amount
      }));

      const newTx: Transaction = {
        id: `TXN-${Math.floor(Math.random() * 90000) + 10000}`,
        date: new Date().toISOString().split("T")[0],
        payee: "Transfer to Savings",
        amount: -amount,
        category: "Savings Pot",
        aiConfidenceScore: 1.00
      };

      setTransactions(prev => [newTx, ...prev]);
      setIsLoading(false);

      logApiCall("POST", "/api/v1/transfers/execute", { sourceAccountId: "Checking", destinationId: "Savings", amount }, { status: "COMPLETED", transactionId: newTx.id }, 200, 500);

      setChatMessages(prev => [
        ...prev,
        { sender: "ai", text: `Success! Checked background liquidity sweep rules and transferred $${amount} to your savings pot. Checking balance is now $${(balances.checking - amount).toFixed(2)}.` }
      ]);
    } else if (action.type === "FREEZE_CARD") {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsFrozen(true);
      setIsLoading(false);
      logApiCall("PUT", "/api/v1/cards/CARD-1122/status", { isFrozen: true }, { status: "UPDATED", isFrozen: true }, 200, 300);
      setChatMessages(prev => [
        ...prev,
        { sender: "ai", text: "Your Verlin Bank debit card has been successfully frozen. You will be blocked from future outbound transactions until it is unfrozen." }
      ]);
    }
  };

  // Workflow 4: Card Freeze Toggles
  const handleCardToggle = async (field: string, val: boolean) => {
    try {
      const reqBody = {
        isFrozen: field === "freeze" ? val : isFrozen,
        onlineEnabled: field === "online" ? val : onlineEnabled,
        intlEnabled: field === "intl" ? val : intlEnabled,
        dailyLimit
      };

      const latency = await makeApiCall("PUT", "/api/v1/cards/CARD-1122/status", reqBody);

      if (field === "freeze") setIsFrozen(val);
      if (field === "online") setOnlineEnabled(val);
      if (field === "intl") setIntlEnabled(val);

      const resBody = {
        status: "UPDATED",
        ...reqBody
      };
      logApiCall("PUT", "/api/v1/cards/CARD-1122/status", reqBody, resBody, 200, latency);
    } catch (err) {
      // Mock error intercept
    }
  };

  const handleSliderLimitChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setDailyLimit(val);
  };

  // Reset State / Database Reset
  const handleResetDb = () => {
    setBalances({
      checking: 4120.50,
      savings: 10000.00,
      investment: 75000.00
    });
    setIsFrozen(false);
    setOnlineEnabled(true);
    setIntlEnabled(false);
    setDailyLimit(1500);
    setDailySpent(0);
    setTransactions([
      { id: "TXN-901", date: "2026-07-10", payee: "Organic Market", amount: -82.40, category: "Food", aiConfidenceScore: 0.98 },
      { id: "TXN-902", date: "2026-07-09", payee: "Starbucks Coffee", amount: -12.50, category: "Food", aiConfidenceScore: 0.99 },
      { id: "TXN-903", date: "2026-07-08", payee: "AWS Cloud Services", amount: -450.00, category: "Tech", aiConfidenceScore: 0.95 },
      { id: "TXN-904", date: "2026-07-07", payee: "Payroll Deposit", amount: 3200.00, category: "Income", aiConfidenceScore: 0.99 },
    ]);
    setChatMessages([
      { sender: "ai", text: "Hello Jane! I am your Verlin Bank AI Assistant. How can I help you manage your funds today?" }
    ]);
    logApiCall("POST", "/api/v1/db/reset", {}, { status: "SUCCESS", message: "Mock databases restored to initial seeding." }, 200, 100);
  };

  // Search filter inside Screen 3 (Ledger)
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.payee.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tx.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={cn("min-h-[85vh] rounded-3xl p-6 transition-all duration-300", isDarkTheme ? "dark bg-bg-dark text-foreground" : "bg-bg-off-white text-text-primary")}>
      
      {/* Brand & Demo Header */}
      <div className="mb-6 flex flex-col justify-between border-b border-border/40 pb-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
              <Landmark className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Verlin <span className="text-accent-teal font-medium">Bank Console</span>
            </span>
            <span className="ml-3 rounded-full bg-cta-amber/10 px-2.5 py-0.5 text-xs font-semibold text-cta-amber border border-cta-amber/20">
              Demo Sandbox
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Testing prototype for Next-Gen banking: Role-based visual states, conversational AI, and autonomous agent threads.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3 md:mt-0">
          <button 
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/60 shadow-xs hover:border-accent-teal/30 hover:bg-accent-teal/5 hover:text-accent-teal transition-all"
          >
            {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button 
            onClick={handleResetDb}
            className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 h-10 text-sm font-semibold hover:border-accent-teal/40 hover:bg-accent-teal/5 hover:text-accent-teal transition-all"
          >
            <RotateCcw className="h-4 w-4" /> Reset DB
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* LEFT COLUMN: THE MOBILE DEVICE SIMULATOR (5 Cols) */}
        <div className="flex justify-center lg:col-span-5 xl:col-span-5">
          <div className="relative h-[780px] w-[370px] overflow-hidden rounded-[50px] border-[12px] border-slate-900 bg-slate-950 shadow-2xl ring-4 ring-slate-800/20">
            
            {/* Phone Notch/Speaker */}
            <div className="absolute top-0 left-1/2 z-50 h-5 w-36 -translate-x-1/2 rounded-b-2xl bg-slate-900">
              <div className="absolute top-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-slate-800" />
            </div>

            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-6 pt-5 pb-2 text-[10px] font-bold text-slate-400">
              <span>9:41 AM</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3 w-3" />
                <span>5G</span>
                <Battery className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Screen Content Wrapper */}
            <div className="relative flex h-full flex-col bg-slate-900 pt-10 text-slate-100">
              
              {/* API Loading Overlay inside Phone Screen */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="h-8 w-8 animate-spin text-accent-teal" />
                      <span className="text-xs tracking-wider text-slate-400">Connecting to Mock Gateway...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Debug Operator Badge (Workflow 1: Admin specific toggle check) */}
              {isLoggedIn && activeRole === "ROLE_SUPPORT_ADMIN" && (
                <div className="absolute top-12 right-4 z-40 animate-pulse rounded-full bg-cta-amber px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-slate-950 shadow-lg">
                  System Operator
                </div>
              )}

              {/* ACTIVE SCREEN RENDERING */}
              <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide">
                
                {/* 1. LOGIN SCREEN */}
                {activeScreen === "login" && !isLoggedIn && (
                  <div className="flex h-full flex-col justify-between pt-6">
                    <div className="mt-8 flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal to-accent-teal text-white shadow-lg">
                        <Landmark className="h-8 w-8" />
                      </div>
                      <h2 className="mt-4 text-2xl font-extrabold tracking-tight">Verlin Bank</h2>
                      <p className="mt-1.5 text-xs text-slate-400">Project Aura Digital Wallet v2.0</p>
                    </div>

                    {!isMfaRequired ? (
                      <form onSubmit={handleLogin} className="mt-6 flex-1 space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                          <input 
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full rounded-xl bg-slate-800/80 border border-slate-700 px-3.5 py-2.5 text-sm outline-none focus:border-accent-teal transition-all text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"}
                              required
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="w-full rounded-xl bg-slate-800/80 border border-slate-700 px-3.5 py-2.5 text-sm outline-none focus:border-accent-teal transition-all pr-10 text-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Location Telemetry warning visualizer */}
                        <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Telemetry Status:</span>
                            <span className={cn("font-bold px-1.5 py-0.5 rounded", telemetryRisk === "HIGH" ? "bg-red-500/20 text-red-400" : "bg-teal-500/20 text-teal-400")}>
                              {telemetryRisk === "HIGH" ? "High Risk IP" : "Standard IP"}
                            </span>
                          </div>
                          <p className="mt-1 text-[9px] text-slate-500 leading-normal">
                            {telemetryRisk === "HIGH" 
                              ? "IP 198.51.100.45 flagged outside registration circle. Handshake will invoke 2FA challenge." 
                              : "Secure workspace telemetry recognized. Fast handshake enabled."}
                          </p>
                        </div>

                        <button 
                          type="submit"
                          className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-accent-teal py-3 text-sm font-bold text-white shadow-md shadow-accent-teal/20 hover:bg-accent-teal/90 transition-all cursor-pointer"
                        >
                          <Fingerprint className="h-4 w-4" /> Log In Securely
                        </button>
                      </form>
                    ) : (
                      // MFA verification Screen
                      <form onSubmit={handleVerifyMfa} className="mt-6 flex-1 space-y-4">
                        <div className="rounded-xl bg-cta-amber/10 border border-cta-amber/30 p-3">
                          <div className="flex gap-2">
                            <ShieldAlert className="h-4 w-4 text-cta-amber shrink-0" />
                            <div>
                              <h4 className="text-xs font-bold text-cta-amber">Verify Your Identity</h4>
                              <p className="mt-0.5 text-[10px] text-slate-300 leading-normal">
                                High-risk connection detected. Enter verification code sent to authorization token device.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">OTP Code</label>
                          <input 
                            type="text"
                            placeholder="Enter 123456 to test"
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value)}
                            maxLength={6}
                            className="w-full text-center tracking-widest text-lg font-bold rounded-xl bg-slate-800 border border-slate-700 px-3 py-2.5 outline-none focus:border-accent-teal text-white"
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full mt-4 rounded-xl bg-cta-amber py-3 text-sm font-bold text-slate-950 hover:bg-cta-amber/90 transition-all cursor-pointer"
                        >
                          Confirm & Authorize
                        </button>

                        <button 
                          type="button"
                          onClick={() => setIsMfaRequired(false)}
                          className="w-full text-center text-xs text-slate-400 hover:text-slate-200 mt-2"
                        >
                          Back to Login
                        </button>
                      </form>
                    )}

                    <div className="mb-4 text-center text-[10px] text-slate-500">
                      Protected by Verlin Cloud Armor &bull; Mock Handshake API
                    </div>
                  </div>
                )}

                {/* 2. DYNAMIC DASHBOARD SCREEN */}
                {activeScreen === "dashboard" && isLoggedIn && (
                  <div className="space-y-5">
                    {/* Welcome Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Welcome Back</p>
                          <h3 className="text-sm font-bold flex items-center gap-1.5">
                            Jane Doe
                            {activeRole === "ROLE_PREMIUM_WEALTH" && (
                              <span className="rounded bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-amber-400 tracking-wider border border-amber-500/30">
                                Gold Tier
                              </span>
                            )}
                          </h3>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveScreen("profile")}
                        className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-800"
                      >
                        <Bell className="h-4 w-4 text-slate-400" />
                        <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                      </button>
                    </div>

                    {/* Net Worth display card */}
                    <div className={cn(
                      "rounded-2xl p-4.5 border shadow-xl relative overflow-hidden transition-all",
                      activeRole === "ROLE_PREMIUM_WEALTH" 
                        ? "bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/20" 
                        : "bg-slate-800/80 border-slate-700"
                    )}>
                      {activeRole === "ROLE_PREMIUM_WEALTH" && (
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Net Worth</span>
                        <button 
                          onClick={() => setIsBalancesVisible(!isBalancesVisible)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          {isBalancesVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold tracking-tight">
                          {isBalancesVisible 
                            ? `$${(balances.checking + balances.savings + (activeRole === "ROLE_PREMIUM_WEALTH" ? balances.investment : 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                            : "••••••"
                          }
                        </span>
                        <span className="text-[10px] font-bold text-teal-400 ml-1">+1.8%</span>
                      </div>
                      <p className="mt-2 text-[9px] text-slate-400">Checking + Savings {activeRole === "ROLE_PREMIUM_WEALTH" && "+ Investment Portfolio"}</p>
                    </div>

                    {/* Quick Action Grid */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">Quick Actions</h4>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <button 
                          onClick={() => setActiveScreen("transfer")}
                          className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-800/50 p-2 hover:bg-slate-850 transition-all cursor-pointer"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                            <Send className="h-4 w-4" />
                          </span>
                          <span className="text-[9px] font-bold">Transfer</span>
                        </button>
                        <button 
                          onClick={() => setActiveScreen("chat")}
                          className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-800/50 p-2 hover:bg-slate-850 transition-all cursor-pointer"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-teal/10 text-accent-teal">
                            <Bot className="h-4 w-4" />
                          </span>
                          <span className="text-[9px] font-bold">AI Chat</span>
                        </button>
                        <button 
                          onClick={() => setActiveScreen("cards")}
                          className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-800/50 p-2 hover:bg-slate-850 transition-all cursor-pointer"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                            <CreditCard className="h-4 w-4" />
                          </span>
                          <span className="text-[9px] font-bold">Cards</span>
                        </button>
                        <button 
                          onClick={() => setActiveScreen("ledger")}
                          className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-800/50 p-2 hover:bg-slate-850 transition-all cursor-pointer"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                            <TrendingUp className="h-4 w-4" />
                          </span>
                          <span className="text-[9px] font-bold">Ledger</span>
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Accounts List */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">Your Accounts</h4>
                      <div className="space-y-2.5">
                        <div 
                          onClick={() => setActiveScreen("ledger")}
                          className="flex items-center justify-between rounded-xl bg-slate-800/60 border border-slate-700/60 p-3 hover:bg-slate-800 cursor-pointer transition-all"
                        >
                          <div>
                            <h5 className="text-xs font-bold">Checking Account</h5>
                            <p className="text-[9px] text-slate-500 mt-0.5">ACC-4321</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold">
                              {isBalancesVisible ? `$${balances.checking.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "••••"}
                            </span>
                            <ChevronRight className="inline-block h-3.5 w-3.5 text-slate-500 ml-1.5" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-slate-800/60 border border-slate-700/60 p-3 hover:bg-slate-800 cursor-pointer transition-all">
                          <div>
                            <h5 className="text-xs font-bold">High-Yield Savings</h5>
                            <p className="text-[9px] text-slate-500 mt-0.5">ACC-5678</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold">
                              {isBalancesVisible ? `$${balances.savings.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "••••"}
                            </span>
                            <ChevronRight className="inline-block h-3.5 w-3.5 text-slate-500 ml-1.5" />
                          </div>
                        </div>

                        {/* CONDITIONAL WEALTH CARD (Workflow 1 Premium Access Requirement) */}
                        {activeRole === "ROLE_PREMIUM_WEALTH" && (
                          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-900 to-amber-950/20 border border-amber-500/20 p-3 shadow-md">
                            <div>
                              <h5 className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                                Investment & Wealth
                                <span className="rounded bg-amber-500/10 text-amber-400 text-[8px] font-bold px-1">PRO</span>
                              </h5>
                              <p className="text-[9px] text-slate-500 mt-0.5">Aura Wealth Core</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-extrabold text-amber-200">
                                {isBalancesVisible ? `$${balances.investment.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "••••"}
                              </span>
                              <ChevronRight className="inline-block h-3.5 w-3.5 text-amber-500/40 ml-1.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Insights and Alerts */}
                    <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Bot className="h-3.5 w-3.5 text-accent-teal" />
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">AI Sweeper & Insights</span>
                      </div>
                      <div className="space-y-2 text-[10px]">
                        {/* Simulated warnings from AGENT_CASHFLOW_FORECASTER */}
                        <div className="flex gap-2 bg-slate-850 p-2 rounded-lg border border-slate-800">
                          <AlertTriangle className="h-3.5 w-3.5 text-cta-amber shrink-0" />
                          <p className="text-slate-300 leading-normal">
                            <strong>[Forecaster]</strong> Rent payment of $1,800 is expected in 3 days. Your forecasted balance will remain positive.
                          </p>
                        </div>
                        {/* Simulated suggestions from AGENT_LIQUIDITY_SWEEPER */}
                        {balances.checking > 3000 && (
                          <div className="flex gap-2 bg-slate-850 p-2 rounded-lg border border-slate-800">
                            <Percent className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                            <div className="text-slate-300 leading-normal">
                              <p><strong>[Liquidity Sweep]</strong> Idle checking balance detected (${balances.checking.toFixed(2)}). Suggest moving excess funds to High-Yield Savings pot.</p>
                              <button 
                                onClick={() => {
                                  setActiveScreen("chat");
                                  setChatMessages(prev => [...prev, {
                                    sender: "ai",
                                    text: "I see you have over $3,000 in your checking account. Shall I run the automated background liquidity sweep and transfer $1,500 to your savings account?",
                                    action: {
                                      type: "ACCOUNT_TRANSFER",
                                      params: { amount: 1500, from: "Checking", to: "Savings" }
                                    }
                                  }]);
                                }}
                                className="mt-1 text-[9px] text-accent-teal hover:underline font-bold"
                              >
                                Sweep Now &rarr;
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* 3. INTERACTIVE LEDGER SCREEN */}
                {activeScreen === "ledger" && isLoggedIn && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => setActiveScreen("dashboard")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-750"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <h3 className="text-sm font-bold">Account Ledger</h3>
                      <div className="w-7" />
                    </div>

                    {/* Balance summary */}
                    <div className="text-center bg-slate-800/40 rounded-xl p-3 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase">Available Checking Balance</span>
                      <h2 className="text-2xl font-extrabold mt-0.5">${balances.checking.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h2>
                    </div>

                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input 
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-4 py-2 text-xs outline-none focus:border-accent-teal text-white"
                      />
                    </div>

                    {/* Category pills */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[10px]">
                      {["All", "Food", "Tech", "Income", "Transfer"].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "px-3 py-1 rounded-full border transition-all cursor-pointer shrink-0 font-semibold",
                            selectedCategory === cat 
                              ? "bg-accent-teal border-accent-teal text-white" 
                              : "bg-slate-800 border-slate-700 text-slate-350"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Ledger List */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <span>Transactions</span>
                        <span>Confidence Score</span>
                      </div>
                      
                      {filteredTransactions.length === 0 ? (
                        <p className="text-center text-slate-500 text-xs py-8">No records match your filters.</p>
                      ) : (
                        filteredTransactions.map(tx => (
                          <div 
                            key={tx.id} 
                            className="flex items-center justify-between rounded-xl bg-slate-850 border border-slate-800/80 p-2.5 hover:bg-slate-800 transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold",
                                tx.amount > 0 ? "bg-teal-500/10 text-teal-400" : "bg-red-500/10 text-red-400"
                              )}>
                                {tx.amount > 0 ? "+" : "-"}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-slate-200">{tx.payee}</h5>
                                <p className="text-[8px] text-slate-500 mt-0.5">{tx.date} &bull; {tx.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={cn("text-xs font-extrabold", tx.amount > 0 ? "text-teal-400" : "text-slate-100")}>
                                {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                              </span>
                              <div className="text-[8px] text-slate-500 mt-0.5 flex items-center justify-end gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5 text-accent-teal" />
                                <span>AI: {(tx.aiConfidenceScore * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 4. MONEY TRANSFER SCREEN */}
                {activeScreen === "transfer" && isLoggedIn && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => setActiveScreen("dashboard")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-750"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <h3 className="text-sm font-bold">Transfer Money</h3>
                      <div className="w-7" />
                    </div>

                    {/* Limits Info Badge */}
                    <div className="rounded-xl bg-slate-800/40 p-2.5 border border-slate-800 text-[10px] text-slate-300 flex justify-between items-center">
                      <span>Daily Outbound limit:</span>
                      <span className="font-bold text-accent-teal">
                        ${(activeRole === "ROLE_RETAIL_USER" ? 5000 : 50000).toLocaleString()}
                      </span>
                    </div>

                    {/* Frozen Card Boundary check warning (Workflow 4) */}
                    {isFrozen && (
                      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-xs flex gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <div>
                          <h4 className="font-bold text-red-400">Card Status: Frozen</h4>
                          <p className="text-[10px] text-red-300/80 leading-normal mt-0.5">
                            Transaction blocked: Your card is currently frozen. Unfreeze it inside the card manager to transfer.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error Banner */}
                    {transferError && (
                      <div className="rounded-xl bg-red-500/15 border border-red-500/30 p-2.5 text-red-400 text-[10px]">
                        {transferError}
                      </div>
                    )}

                    <div className="space-y-3.5">
                      {/* Funding Account Selector */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Fund Source</label>
                        <select 
                          value={transferSource}
                          onChange={(e) => setTransferSource(e.target.value)}
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs outline-none text-white focus:border-accent-teal"
                        >
                          <option value="ACC-4321">Checking Account - ACC-4321 (${balances.checking.toFixed(2)})</option>
                          <option value="ACC-5678">Savings Account - ACC-5678 (${balances.savings.toFixed(2)})</option>
                        </select>
                      </div>

                      {/* Recipient Picker */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Select Recipient</label>
                        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
                          {recipients.map(r => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setTransferRecipient(r.id)}
                              className={cn(
                                "flex flex-col items-center gap-1 shrink-0 p-2 rounded-xl border transition-all cursor-pointer w-18",
                                transferRecipient === r.id 
                                  ? "bg-accent-teal/15 border-accent-teal text-white" 
                                  : "bg-slate-800 border-slate-700 text-slate-400"
                              )}
                            >
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-200">
                                {r.avatar}
                              </span>
                              <span className="text-[8px] font-bold truncate w-full text-center">{r.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Numeric Pad & Input */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Transfer Amount</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="0.00"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            disabled={isFrozen}
                            className="w-full text-lg font-bold rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-4 py-2.5 outline-none focus:border-accent-teal text-white disabled:opacity-40"
                          />
                        </div>
                      </div>

                      {/* Quick amount tabs */}
                      <div className="flex gap-2">
                        {["10", "50", "250", "5000", "55000"].map(preset => (
                          <button
                            key={preset}
                            disabled={isFrozen}
                            onClick={() => {
                              if (preset === "MAX") {
                                setTransferAmount(balances.checking.toString());
                              } else {
                                setTransferAmount(preset);
                              }
                            }}
                            className="flex-1 bg-slate-800 border border-slate-700 hover:border-accent-teal rounded-lg py-1.5 text-[10px] font-bold text-slate-300 disabled:opacity-30 cursor-pointer"
                          >
                            +${parseInt(preset).toLocaleString()}
                          </button>
                        ))}
                      </div>

                      {/* Submit */}
                      <button
                        type="button"
                        disabled={isFrozen || !transferAmount}
                        onClick={() => handleExecuteTransfer()}
                        className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-accent-teal py-3 text-sm font-bold text-white shadow-md hover:bg-accent-teal/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" /> Initiate Transfer
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. AI CHAT SCREEN */}
                {activeScreen === "chat" && isLoggedIn && (
                  <div className="flex h-full flex-col justify-between pt-2">
                    
                    {/* Header */}
                    <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2">
                      <button 
                        onClick={() => setActiveScreen("dashboard")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-teal/10 text-accent-teal">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold">Verlin AI Copilot</h4>
                        <span className="text-[8px] text-teal-400 font-bold block leading-none">Online &bull; Autonomous Active</span>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 text-[11px] scrollbar-hide max-h-[500px]">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={cn("flex flex-col max-w-[85%]", msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start")}>
                          <div className={cn(
                            "rounded-xl px-3 py-2.5 leading-normal",
                            msg.sender === "user" ? "bg-accent-teal text-white rounded-tr-none" : "bg-slate-800 text-slate-100 rounded-tl-none"
                          )}>
                            {msg.text}
                          </div>

                          {/* ACTION WIDGETS (Workflow 3 execution steps) */}
                          {msg.action && (
                            <div className="mt-2 w-full rounded-xl bg-slate-850 border border-slate-800 p-3 space-y-2">
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-accent-teal uppercase tracking-wider">
                                <Info className="h-3 w-3" />
                                <span>Proposed AI Operations</span>
                              </div>
                              
                              <div className="space-y-1 text-[10px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Action:</span>
                                  <span className="font-semibold text-slate-200">
                                    {msg.action.type === "ACCOUNT_TRANSFER" ? "P2P Account Transfer" : "Freeze Card Security"}
                                  </span>
                                </div>
                                {msg.action.params.amount && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Amount:</span>
                                    <span className="font-extrabold text-white">${msg.action.params.amount.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Source:</span>
                                  <span className="text-slate-300">Checking Account</span>
                                </div>
                              </div>

                              <div className="flex gap-2 mt-2 pt-1 border-t border-slate-800">
                                <button
                                  onClick={() => handleConfirmAiAction(msg.action)}
                                  className="flex-1 rounded-lg bg-accent-teal text-white py-1.5 font-bold text-[9px] text-center hover:bg-accent-teal/90 transition-all cursor-pointer"
                                >
                                  Confirm Action
                                </button>
                                <button
                                  onClick={() => {
                                    setChatMessages(prev => [...prev, { sender: "ai", text: "Operation cancelled as requested." }]);
                                  }}
                                  className="rounded-lg bg-slate-800 border border-slate-700 px-2 text-[9px] font-bold text-slate-300 hover:text-white"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide text-[9px]">
                      <button 
                        onClick={() => {
                          setChatInput("Move $100 to my savings account");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white shrink-0 cursor-pointer"
                      >
                        "Move $100 to savings"
                      </button>
                      <button 
                        onClick={() => {
                          setChatInput("Freeze my debit card");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white shrink-0 cursor-pointer"
                      >
                        "Freeze my card"
                      </button>
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={handleSendMessage} className="relative mt-1">
                      <input 
                        type="text"
                        placeholder="Type to instruct AI Agent..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-4.5 pr-10 py-2.5 text-xs outline-none focus:border-accent-teal text-white"
                      />
                      <button 
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-accent-teal hover:bg-accent-teal/90 text-white cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>

                  </div>
                )}

                {/* 6. CARD MANAGEMENT SCREEN */}
                {activeScreen === "cards" && isLoggedIn && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => setActiveScreen("dashboard")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <h3 className="text-sm font-bold">Card Management</h3>
                      <div className="w-7" />
                    </div>

                    {/* High-Fidelity Credit Card Visualizer */}
                    <div className={cn(
                      "rounded-2xl p-4.5 h-44 shadow-2xl relative overflow-hidden transition-all text-white border flex flex-col justify-between",
                      activeRole === "ROLE_PREMIUM_WEALTH" 
                        ? "bg-gradient-to-tr from-slate-900 via-amber-900 to-amber-950/80 border-amber-500/30" 
                        : "bg-gradient-to-tr from-slate-850 to-slate-950 border-slate-800"
                    )}>
                      {isFrozen && (
                        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-10">
                          <span className="px-3 py-1 rounded-full border border-red-500 bg-red-950/90 text-red-400 font-extrabold text-[10px] uppercase tracking-widest flex items-center gap-1 shadow-lg">
                            <Lock className="h-3 w-3" /> Card Frozen
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Verlin Card Service</span>
                          <h4 className="text-xs font-bold mt-0.5">Jane Doe</h4>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300">Visa Debit</span>
                      </div>

                      <div className="my-2">
                        <p className="text-sm font-semibold tracking-[0.2em]">••••  ••••  ••••  1122</p>
                      </div>

                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[7px] uppercase font-bold text-slate-500">Tier Level</span>
                          <p className="text-[9px] font-extrabold text-amber-400">
                            {activeRole === "ROLE_PREMIUM_WEALTH" ? "PREMIUM WEALTH" : "RETAIL SECURE"}
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-[7px] uppercase font-bold text-slate-500">Expiry</span>
                            <p className="text-[9px] font-semibold">08/30</p>
                          </div>
                          <div>
                            <span className="text-[7px] uppercase font-bold text-slate-500">CVV</span>
                            <p className="text-[9px] font-semibold">***</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Control Switches (Workflow 4 status toggles) */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between rounded-xl bg-slate-800/40 p-3 border border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <Lock className={cn("h-4 w-4", isFrozen ? "text-red-400" : "text-slate-400")} />
                          <div>
                            <h5 className="text-xs font-bold">Freeze Card</h5>
                            <p className="text-[8px] text-slate-500">Block all outbound transactions</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCardToggle("freeze", !isFrozen)}
                          className={cn(
                            "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            isFrozen ? "bg-red-500" : "bg-slate-700"
                          )}
                        >
                          <span className={cn(
                            "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                            isFrozen ? "translate-x-4.5" : "translate-x-0"
                          )} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-800/40 p-3 border border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-slate-400" />
                          <div>
                            <h5 className="text-xs font-bold">Online Payments</h5>
                            <p className="text-[8px] text-slate-500">Enable online card purchases</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCardToggle("online", !onlineEnabled)}
                          className={cn(
                            "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                            onlineEnabled ? "bg-accent-teal" : "bg-slate-700"
                          )}
                        >
                          <span className={cn(
                            "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out",
                            onlineEnabled ? "translate-x-4.5" : "translate-x-0"
                          )} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-800/40 p-3 border border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <div>
                            <h5 className="text-xs font-bold">International Operations</h5>
                            <p className="text-[8px] text-slate-500">Enable cross-border payments</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCardToggle("intl", !intlEnabled)}
                          className={cn(
                            "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                            intlEnabled ? "bg-accent-teal" : "bg-slate-700"
                          )}
                        >
                          <span className={cn(
                            "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out",
                            intlEnabled ? "translate-x-4.5" : "translate-x-0"
                          )} />
                        </button>
                      </div>

                      {/* Daily spending limit slider */}
                      <div className="rounded-xl bg-slate-800/40 p-3 border border-slate-800/60 space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Daily Card Limit</span>
                          <span className="text-accent-teal">${dailyLimit.toLocaleString()}</span>
                        </div>
                        <input 
                          type="range"
                          min={500}
                          max={50000}
                          step={500}
                          value={dailyLimit}
                          onChange={handleSliderLimitChange}
                          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent-teal"
                        />
                        <div className="flex justify-between text-[8px] text-slate-500 font-bold">
                          <span>MIN: $500</span>
                          <span>MAX: $50,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. PROFILE & SMART SECURITY SCREEN */}
                {activeScreen === "profile" && isLoggedIn && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => setActiveScreen("dashboard")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <h3 className="text-sm font-bold">Security Settings</h3>
                      <div className="w-7" />
                    </div>

                    {/* Member Profile info Card */}
                    <div className="rounded-xl bg-slate-800/40 p-3 border border-slate-800 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-teal/15 text-accent-teal text-lg font-bold">
                        JD
                      </div>
                      <h4 className="font-bold mt-2 text-sm">Jane Doe</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">jane.doe@verlinbank.com</p>
                      
                      <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-[9px] font-bold text-slate-300">
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          activeRole === "ROLE_PREMIUM_WEALTH" ? "bg-amber-400" : "bg-teal-400"
                        )} />
                        <span>Role: {activeRole.replace("ROLE_", "").replace("_", " ")}</span>
                      </div>
                    </div>

                    {/* Settings Toggles */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between rounded-xl bg-slate-800/20 p-2.5 border border-slate-800/60">
                        <span>Enable Biometric Login</span>
                        <input 
                          type="checkbox" 
                          checked={biometricsEnabled}
                          onChange={(e) => setBiometricsEnabled(e.target.checked)}
                          className="w-4 h-4 accent-accent-teal cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-800/20 p-2.5 border border-slate-800/60">
                        <span>Send Push Alerts</span>
                        <input 
                          type="checkbox" 
                          checked={pushAlertsEnabled}
                          onChange={(e) => setPushAlertsEnabled(e.target.checked)}
                          className="w-4 h-4 accent-accent-teal cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-800/20 p-2.5 border border-slate-800/60">
                        <span>Theme Selector</span>
                        <select 
                          value={isDarkTheme ? "dark" : "light"}
                          onChange={(e) => setIsDarkTheme(e.target.value === "dark")}
                          className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] text-white outline-none focus:border-accent-teal"
                        >
                          <option value="light">Light Mode</option>
                          <option value="dark">Dark Mode</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setIsLoggedIn(false);
                        setActiveScreen("login");
                        logApiCall("POST", "/api/v1/auth/logout", {}, { status: "SUCCESS" }, 200, 100);
                      }}
                      className="w-full mt-4 rounded-xl border border-red-500/40 hover:bg-red-500/10 py-2.5 text-xs font-bold text-red-400 transition-all cursor-pointer text-center"
                    >
                      Secure Log Out
                    </button>
                  </div>
                )}

              </div>

              {/* Bottom Simulator Navigation Bar (only visible when logged in) */}
              {isLoggedIn && (
                <div className="flex justify-around items-center border-t border-slate-800 bg-slate-950/80 backdrop-blur px-2 py-3 text-slate-400 text-[9px] font-medium z-30">
                  <button 
                    onClick={() => setActiveScreen("dashboard")}
                    className={cn("flex flex-col items-center gap-1", activeScreen === "dashboard" ? "text-accent-teal font-bold" : "hover:text-slate-200")}
                  >
                    <Landmark className="h-4.5 w-4.5" />
                    <span>Home</span>
                  </button>
                  <button 
                    onClick={() => setActiveScreen("ledger")}
                    className={cn("flex flex-col items-center gap-1", activeScreen === "ledger" ? "text-accent-teal font-bold" : "hover:text-slate-200")}
                  >
                    <TrendingUp className="h-4.5 w-4.5" />
                    <span>History</span>
                  </button>
                  <button 
                    onClick={() => setActiveScreen("transfer")}
                    className={cn("flex flex-col items-center gap-1", activeScreen === "transfer" ? "text-accent-teal font-bold" : "hover:text-slate-200")}
                  >
                    <Send className="h-4.5 w-4.5" />
                    <span>Transfer</span>
                  </button>
                  <button 
                    onClick={() => setActiveScreen("chat")}
                    className={cn("flex flex-col items-center gap-1", activeScreen === "chat" ? "text-accent-teal font-bold" : "hover:text-slate-200")}
                  >
                    <Bot className="h-4.5 w-4.5" />
                    <span>Assistant</span>
                  </button>
                  <button 
                    onClick={() => setActiveScreen("cards")}
                    className={cn("flex flex-col items-center gap-1", activeScreen === "cards" ? "text-accent-teal font-bold" : "hover:text-slate-200")}
                  >
                    <CreditCard className="h-4.5 w-4.5" />
                    <span>Cards</span>
                  </button>
                </div>
              )}

              {/* Bottom Home Indicator */}
              <div className="flex justify-center pb-2 bg-slate-950/80">
                <div className="h-1 w-28 rounded-full bg-slate-800" />
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DEVELOPER DASHBOARD & CONTROL DECK (7 Cols) */}
        <div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-7">
          
          {/* Section 1: Role Configuration & Handshake Settings */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-accent-teal" />
              User Role Handshake Simulator (RBAC)
            </h3>
            <p className="mt-1 text-xs text-text-secondary">
              Alter the active authentication role before log-in handshake to observe interface and boundary limit alterations.
            </p>

            <div className="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-3">
              {[
                { role: "ROLE_RETAIL_USER", label: "Retail Client", desc: "Daily limit $5k & reactive AI", color: "border-teal-500/30 text-teal-600 bg-teal-50/50 dark:bg-teal-950/15" },
                { role: "ROLE_PREMIUM_WEALTH", label: "Premium Wealth", desc: "Daily limit $50k, gold accents & advisor", color: "border-amber-500/30 text-amber-600 bg-amber-50/50 dark:bg-amber-950/15" },
                { role: "ROLE_SUPPORT_ADMIN", label: "Support Operator", desc: "Launches local floating widget", color: "border-indigo-500/30 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/15" }
              ].map(opt => (
                <button
                  key={opt.role}
                  onClick={() => {
                    setActiveRole(opt.role as RoleType);
                    logApiCall("POST", "/api/v1/auth/role-change", { requestedRole: opt.role }, { updatedRole: opt.role }, 200, 50);
                  }}
                  className={cn(
                    "flex flex-col justify-between items-start rounded-xl p-3.5 border text-left cursor-pointer transition-all hover:shadow-sm",
                    activeRole === opt.role 
                      ? "border-accent-teal ring-2 ring-accent-teal/15 bg-accent-teal/5 dark:bg-accent-teal/5 text-accent-teal" 
                      : opt.color
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {activeRole === opt.role && <Check className="h-4 w-4" />}
                  </div>
                  <span className="mt-2 text-[10px] leading-relaxed text-text-secondary">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Custom Telemetry IP Switcher */}
            <div className="mt-4 pt-4 border-t border-border/50 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h4 className="text-xs font-bold text-foreground">Sign-in IP Telemetry Risk Setting</h4>
                <p className="text-[10px] text-text-secondary mt-0.5">Simulate different connecting networks to trigger MFA challenges.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTelemetryRisk("LOW")}
                  className={cn("px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer", telemetryRisk === "LOW" ? "bg-accent-teal text-white border-accent-teal" : "bg-card border-border hover:bg-muted text-text-secondary")}
                >
                  IP: Safe Node (192.168)
                </button>
                <button
                  onClick={() => setTelemetryRisk("HIGH")}
                  className={cn("px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer", telemetryRisk === "HIGH" ? "bg-red-500 text-white border-red-500" : "bg-card border-border hover:bg-muted text-text-secondary")}
                >
                  IP: Remote Risk (198.51)
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Mock API & Error Injections */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Terminal className="h-5 w-5 text-accent-teal" />
              API Gateway Network Simulator
            </h3>
            <p className="mt-1 text-xs text-text-secondary">
              Simulate server lag and introduce HTTP codes to analyze how the client app handles error boundaries.
            </p>

            <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">Network Delay</span>
                  <input 
                    type="checkbox"
                    checked={latencyMode}
                    onChange={(e) => setLatencyMode(e.target.checked)}
                    className="accent-accent-teal cursor-pointer h-4 w-4"
                  />
                </div>
                <p className="text-[10px] text-text-secondary leading-normal">
                  Simulates random 150ms-600ms latency on client calls.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-red-500">Inject 500 Error</span>
                  <input 
                    type="checkbox"
                    checked={inject500}
                    onChange={(e) => {
                      setInject500(e.target.checked);
                      if (e.target.checked) setInject422(false);
                    }}
                    className="accent-red-500 cursor-pointer h-4 w-4"
                  />
                </div>
                <p className="text-[10px] text-text-secondary leading-normal">
                  Forces gateway endpoints to throw HTTP 500 exceptions.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-cta-amber">Inject 422 Validation</span>
                  <input 
                    type="checkbox"
                    checked={inject422}
                    onChange={(e) => {
                      setInject422(e.target.checked);
                      if (e.target.checked) setInject500(false);
                    }}
                    className="accent-cta-amber cursor-pointer h-4 w-4"
                  />
                </div>
                <p className="text-[10px] text-text-secondary leading-normal">
                  Forces validator middleware to fail payload handshakes (HTTP 422).
                </p>
              </div>
            </div>

            {/* Direct Balance modifier panel (Debug Operator) */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <h4 className="text-xs font-bold text-foreground">Mock Accounts Balance Modifier</h4>
              <p className="text-[10px] text-text-secondary mt-0.5">Directly write state values inside the memory mock datastore.</p>
              
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Checking Balance</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted">$</span>
                    <input 
                      type="number"
                      value={balances.checking}
                      onChange={(e) => setBalances(prev => ({ ...prev, checking: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs font-bold rounded-lg border border-border bg-card pl-6 pr-2 py-1.5 outline-none focus:border-accent-teal"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Savings Balance</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted">$</span>
                    <input 
                      type="number"
                      value={balances.savings}
                      onChange={(e) => setBalances(prev => ({ ...prev, savings: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs font-bold rounded-lg border border-border bg-card pl-6 pr-2 py-1.5 outline-none focus:border-accent-teal"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Investments</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted">$</span>
                    <input 
                      type="number"
                      value={balances.investment}
                      onChange={(e) => setBalances(prev => ({ ...prev, investment: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs font-bold rounded-lg border border-border bg-card pl-6 pr-2 py-1.5 outline-none focus:border-accent-teal"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: API Console logs and background Agent monitor */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex-1 flex flex-col min-h-[300px]">
            <div className="flex border-b border-border/50 pb-3 justify-between items-center">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("logs")}
                  className={cn("text-xs font-bold tracking-tight pb-1 relative", activeTab === "logs" ? "text-accent-teal" : "text-text-secondary")}
                >
                  API Request Logger ({apiLogs.length})
                  {activeTab === "logs" && <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-accent-teal" />}
                </button>
                <button
                  onClick={() => setActiveTab("agents")}
                  className={cn("text-xs font-bold tracking-tight pb-1 relative", activeTab === "agents" ? "text-accent-teal" : "text-text-secondary")}
                >
                  AI Agents Simulation ({["FRAUD_COP", "CASHFLOW", "SWEEPER"].length})
                  {activeTab === "agents" && <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-accent-teal" />}
                </button>
              </div>

              {activeTab === "logs" && (
                <button 
                  onClick={() => setApiLogs([])}
                  className="text-[10px] font-bold text-red-500 hover:underline"
                >
                  Clear Console Logs
                </button>
              )}
            </div>

            <div className="flex-1 mt-4 flex flex-col">
              
              {/* Tab 1: API Live Logs */}
              {activeTab === "logs" && (
                <div 
                  ref={logTerminalRef}
                  className="flex-1 overflow-y-auto max-h-[350px] bg-slate-950 font-mono text-[10.5px] p-4 rounded-xl border border-slate-800 text-slate-300 space-y-3"
                >
                  {apiLogs.length === 0 ? (
                    <div className="text-center text-slate-600 py-16">
                      &gt; Console Idle. Initiate actions inside the phone simulator to observe HTTP exchanges.
                    </div>
                  ) : (
                    apiLogs.map(log => (
                      <div key={log.id} className="border-b border-slate-900 pb-2 space-y-1">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-slate-500">{log.timestamp}</span>
                          <span className={cn(
                            "font-bold px-1 rounded",
                            log.status >= 500 ? "bg-red-500/20 text-red-400" :
                            log.status >= 400 ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-green-500/20 text-green-400"
                          )}>
                            HTTP {log.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-extrabold text-[10px]",
                            log.method === "POST" ? "text-cyan-400" :
                            log.method === "PUT" ? "text-yellow-400" :
                            "text-green-400"
                          )}>{log.method}</span>
                          <span className="text-slate-200 font-semibold">{log.url}</span>
                          <span className="text-slate-500 text-[9px] ml-auto">{log.latency}ms lag</span>
                        </div>

                        {/* Request payload */}
                        <div className="pl-4 mt-1 space-y-0.5 text-slate-400">
                          <div>
                            <span className="text-slate-550">&gt; Req Payload:</span>{" "}
                            <span className="text-slate-350">{JSON.stringify(log.requestBody)}</span>
                          </div>
                          <div>
                            <span className="text-slate-550">&lt; Res Payload:</span>{" "}
                            <span className={cn(log.status >= 400 ? "text-red-400" : "text-teal-400")}>
                              {JSON.stringify(log.responseBody)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: AI Agents monitoring */}
              {activeTab === "agents" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-500/10 text-teal-500">
                          <ShieldAlert className="h-4 w-4" />
                        </span>
                        <h4 className="text-xs font-bold text-foreground">AGENT_FRAUD_COP</h4>
                      </div>
                      <span className="text-[9px] uppercase bg-green-500/15 text-green-500 font-bold px-2 py-0.5 rounded">Active Listening</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-normal">
                      Monitors incoming transfer vectors in real-time. Checks client connecting coordinates against recognized ISP nodes.
                    </p>
                    <div className="bg-card rounded-lg p-2.5 border border-border text-[10px] space-y-1.5 font-mono text-slate-500 dark:text-slate-400">
                      <div>[FRAUD_COP] Scanning telemetry handshakes for IP validation...</div>
                      <div>[FRAUD_COP] Current client GPS: {telemetryRisk === "HIGH" ? "Flagged Risk Coordinates (High Altitude Access)" : "Safe Home Region Detected."}</div>
                      <div>[FRAUD_COP] Limit check boundaries active for active role model constraints.</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10 text-indigo-500">
                          <Bot className="h-4 w-4" />
                        </span>
                        <h4 className="text-xs font-bold text-foreground">AGENT_CASHFLOW_FORECASTER</h4>
                      </div>
                      <span className="text-[9px] uppercase bg-green-500/15 text-green-500 font-bold px-2 py-0.5 rounded">Active Listening</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-normal">
                      Analyzes current ledger distributions (Food, Rent, Salary deposits) to build upcoming 30-day forecast indexes.
                    </p>
                    <div className="bg-card rounded-lg p-2.5 border border-border text-[10px] space-y-1.5 font-mono text-slate-500 dark:text-slate-400">
                      <div>[FORECASTER] Evaluated chronological dataset &bull; 4 items seeded in-memory.</div>
                      <div>[FORECASTER] Warning generated: Expected debit target [Rent] ($1,800) in 3 days.</div>
                      <div>[FORECASTER] Checking account cash balance will stay above boundary minimum of $2,300.</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-purple-500/10 text-purple-500">
                          <TrendingUp className="h-4 w-4" />
                        </span>
                        <h4 className="text-xs font-bold text-foreground">AGENT_LIQUIDITY_SWEEPER</h4>
                      </div>
                      <span className="text-[9px] uppercase bg-green-500/15 text-green-500 font-bold px-2 py-0.5 rounded">Active Listening</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-normal">
                      Monitors checking accounts for idle cash deposits. If the checking account balance exceeds $3,000, triggers a sweep prompt to savings pots (+4.5% APY).
                    </p>
                    <div className="bg-card rounded-lg p-2.5 border border-border text-[10px] space-y-1.5 font-mono text-slate-500 dark:text-slate-400">
                      <div>[SWEEPER] Checking account balance evaluated: ${balances.checking.toFixed(2)}</div>
                      {balances.checking > 3000 ? (
                        <div className="text-teal-500 font-bold">[SWEEPER] ALERT: High Idle Cash. Suggested Transfer: $1,500.00 to Savings (ACC-5678).</div>
                      ) : (
                        <div>[SWEEPER] Idle cash limits within bounds. Sweep prompt dormant.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
