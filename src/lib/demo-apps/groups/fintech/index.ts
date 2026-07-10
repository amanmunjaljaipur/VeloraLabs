/**
 * Demo app categories: fintech
 * Deploy unit: src/lib/demo-apps/groups/fintech/
 */

import { ent, type DemoCategoryDef, DEMO_GROUP_LABELS } from "../../types";

const G = DEMO_GROUP_LABELS;

export const CATEGORIES: DemoCategoryDef[] = [
{
    slug: "digital-banking",
    name: "Digital Banking & Neobanks",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "Mobile-first accounts",
    description: "Full neobank: accounts, send money, UPI, cards, bills, KYC, ops.",
    examples: ["Revolut", "Chime", "Monzo"],
    productKind: "banking",
    brandName: "Horizon Bank",
    roles: [
      { id: "customer", label: "Customer", description: "Bank daily", canCreate: true, canManage: true, isDefault: true },
      { id: "support", label: "Support agent", description: "Cases", canManage: true, canCreate: true },
      { id: "ops", label: "Bank ops", description: "Risk queue", canManage: true, canCreate: true },
    ],
    entities: [
      ent("account", "Account", ["Active", "Frozen", "Closed"], ["title", "amount", "level", "status"], [
        { title: "Everyday Savings", amount: 84250, level: "Savings", status: "Active" },
        { title: "Salary Current", amount: 126400, level: "Current", status: "Active" },
        { title: "UPI Wallet", amount: 2340, level: "Wallet", status: "Active" },
        { title: "Emergency Fund", amount: 50000, level: "Savings", status: "Frozen" },
      ]),
      ent("transfer", "Transfer", ["Pending", "2FA", "Completed", "Failed"], ["title", "amount", "description", "status"], [
        { title: "Asha Sharma", amount: 1500, description: "Dinner", status: "Completed" },
        { title: "Rent", amount: 25000, description: "Monthly", status: "Pending" },
        { title: "Unknown UPI", amount: 9000, description: "Flagged", status: "2FA" },
        { title: "Failed IMPS", amount: 500, description: "Retry", status: "Failed" },
      ]),
      ent("card", "Card", ["Active", "Frozen", "Blocked"], ["title", "amount", "description", "status"], [
        { title: "Primary debit", amount: 50000, description: "•••• 4821", status: "Active" },
        { title: "Virtual", amount: 15000, description: "•••• 9033", status: "Active" },
        { title: "Travel", amount: 20000, description: "•••• 1102", status: "Frozen" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Balances" },
      { id: "accounts", title: "Accounts", type: "list", entityId: "account", description: "All accounts" },
      { id: "send", title: "Send money", type: "transfer", entityId: "transfer", description: "Pay" },
      { id: "cards", title: "Cards", type: "board", entityId: "card", description: "Freeze/limits" },
      { id: "transfers", title: "Transfers", type: "list", entityId: "transfer", description: "History" },
      { id: "ops", title: "Ops queue", type: "board", entityId: "transfer", roleIds: ["ops", "support"], description: "Risk" },
      { id: "settings", title: "Security", type: "settings", description: "2FA" },
    ],
    workflows: [
      { id: "wf-pay", name: "Send money", description: "Customer pays", roleId: "customer", steps: ["Send", "OTP", "Done"], moduleId: "send", entityId: "transfer" },
      { id: "wf-card", name: "Freeze card", description: "Customer freezes", roleId: "customer", steps: ["Cards", "Freeze"], moduleId: "cards", entityId: "card" },
      { id: "wf-ops", name: "Clear risk", description: "Ops approves", roleId: "ops", steps: ["Ops", "Approve"], moduleId: "ops", entityId: "transfer" },
    ],
  },
  {
    slug: "mobile-wallets",
    name: "Mobile Wallets & P2P Payments",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "P2P & tap-to-pay",
    description: "PayPal/Venmo-style wallet balance, P2P, requests, disputes.",
    examples: ["PayPal", "Venmo", "Cash App", "GPay"],
    productKind: "banking",
    brandName: "Verlin Pay",
    roles: [
      { id: "user", label: "User", description: "Send & receive", canCreate: true, canManage: true, isDefault: true },
      { id: "merchant", label: "Merchant", description: "Collect payments", canCreate: true, canManage: true },
      { id: "risk", label: "Risk analyst", description: "Fraud queue", canManage: true },
    ],
    entities: [
      ent("payment", "Payment", ["Requested", "Completed", "Declined", "Disputed"], ["title", "amount", "description", "status"], [
        { title: "Split dinner", amount: 850, description: "To Asha", status: "Completed" },
        { title: "Rent share", amount: 12000, description: "Request", status: "Requested" },
        { title: "Refund", amount: 499, description: "Merchant", status: "Declined" },
        { title: "Unknown charge", amount: 2000, description: "Dispute", status: "Disputed" },
      ]),
    ],
    modules: [
      { id: "home", title: "Wallet", type: "dashboard", description: "Balance" },
      { id: "pay", title: "Send / request", type: "form", entityId: "payment", description: "P2P" },
      { id: "activity", title: "Activity", type: "board", entityId: "payment", description: "History" },
      { id: "merchant", title: "Merchant", type: "list", entityId: "payment", roleIds: ["merchant"], description: "Collections" },
      { id: "risk", title: "Risk", type: "board", entityId: "payment", roleIds: ["risk"], description: "Fraud" },
      { id: "settings", title: "Settings", type: "settings", description: "Linked banks" },
    ],
    workflows: [
      { id: "wf-p2p", name: "Send P2P", description: "User pays friend", roleId: "user", steps: ["Pay", "Confirm", "Done"], moduleId: "pay", entityId: "payment" },
      { id: "wf-merch", name: "Collect payment", description: "Merchant tracks", roleId: "merchant", steps: ["Merchant", "Complete"], moduleId: "merchant", entityId: "payment" },
      { id: "wf-risk", name: "Fraud review", description: "Risk disputes", roleId: "risk", steps: ["Risk", "Action"], moduleId: "risk", entityId: "payment" },
    ],
  },
  {
    slug: "retail-banking",
    name: "Traditional Retail Banking",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "Branch bank mobile portal",
    description: "Chase-style accounts, statements, cheques, branch appointments.",
    examples: ["Chase", "Bank of America", "HSBC"],
    productKind: "banking",
    brandName: "Verlin National Bank",
    roles: [
      { id: "customer", label: "Customer", description: "Everyday banking", canCreate: true, isDefault: true },
      { id: "teller", label: "Branch staff", description: "Appointments", canManage: true, canCreate: true },
      { id: "rm", label: "Relationship manager", description: "Priority clients", canManage: true },
    ],
    entities: [
      ent("account", "Account", ["Active", "Dormant", "Closed"], ["title", "amount", "status"], [
        { title: "Checking ****1200", amount: 45200, status: "Active" },
        { title: "Savings ****8841", amount: 210000, status: "Active" },
        { title: "Old joint", amount: 0, status: "Dormant" },
      ]),
      ent("appointment", "Branch visit", ["Booked", "Completed", "No-show", "Cancelled"], ["title", "when", "status"], [
        { title: "Loan consult", when: "Fri 11:00", status: "Booked" },
        { title: "Card pickup", when: "Mon 15:00", status: "Completed" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Overview" },
      { id: "accounts", title: "Accounts", type: "list", entityId: "account", description: "Balances" },
      { id: "book", title: "Book branch", type: "form", entityId: "appointment", description: "Visit" },
      { id: "visits", title: "Appointments", type: "schedule", entityId: "appointment", description: "Schedule" },
      { id: "staff", title: "Branch queue", type: "board", entityId: "appointment", roleIds: ["teller", "rm"], description: "Staff" },
      { id: "settings", title: "Settings", type: "settings", description: "Alerts" },
    ],
    workflows: [
      { id: "wf-acc", name: "View accounts", description: "Customer checks balances", roleId: "customer", steps: ["Home", "Accounts"], moduleId: "accounts", entityId: "account" },
      { id: "wf-book", name: "Book branch visit", description: "Customer books", roleId: "customer", steps: ["Book", "Confirm"], moduleId: "book", entityId: "appointment" },
      { id: "wf-staff", name: "Serve customer", description: "Teller completes visit", roleId: "teller", steps: ["Queue", "Complete"], moduleId: "staff", entityId: "appointment" },
    ],
  },
  {
    slug: "insurtech",
    name: "Insurtech & Insurance Portals",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "Policies & claims",
    description: "Lemonade-style policies, claims FNOL, adjuster workflow.",
    examples: ["Lemonade", "Geico", "Oscar Health"],
    productKind: "generic",
    brandName: "Verlin Cover",
    roles: [
      { id: "policyholder", label: "Policyholder", description: "Buy & claim", canCreate: true, isDefault: true },
      { id: "agent", label: "Agent", description: "Sell policies", canCreate: true, canManage: true },
      { id: "adjuster", label: "Claims adjuster", description: "Settle claims", canManage: true },
    ],
    entities: [
      ent("policy", "Policy", ["Active", "Pending", "Lapsed", "Cancelled"], ["title", "amount", "description", "status"], [
        { title: "Health Plus", amount: 12000, description: "Annual", status: "Active" },
        { title: "Auto Secure", amount: 8500, description: "Comprehensive", status: "Active" },
        { title: "Home Guard", amount: 6000, description: "Pending docs", status: "Pending" },
      ]),
      ent("claim", "Claim", ["FNOL", "Investigating", "Approved", "Denied"], ["title", "amount", "description", "status"], [
        { title: "Windshield", amount: 12000, description: "Auto", status: "FNOL" },
        { title: "Hospital bill", amount: 45000, description: "Health", status: "Investigating" },
        { title: "Phone theft", amount: 30000, description: "Denied proof", status: "Denied" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Coverage" },
      { id: "policies", title: "Policies", type: "list", entityId: "policy", description: "Your cover" },
      { id: "claim", title: "File claim", type: "form", entityId: "claim", description: "FNOL" },
      { id: "claims", title: "Claims", type: "board", entityId: "claim", description: "Track" },
      { id: "sell", title: "New policy", type: "form", entityId: "policy", roleIds: ["agent"], description: "Sell" },
      { id: "adjust", title: "Adjuster desk", type: "board", entityId: "claim", roleIds: ["adjuster"], description: "Settle" },
      { id: "settings", title: "Settings", type: "settings", description: "Documents" },
    ],
    workflows: [
      { id: "wf-claim", name: "File claim", description: "Policyholder FNOL", roleId: "policyholder", steps: ["File", "Track"], moduleId: "claim", entityId: "claim" },
      { id: "wf-sell", name: "Issue policy", description: "Agent sells", roleId: "agent", steps: ["New policy", "Active"], moduleId: "sell", entityId: "policy" },
      { id: "wf-adj", name: "Settle claim", description: "Adjuster decides", roleId: "adjuster", steps: ["Desk", "Approve/Deny"], moduleId: "adjust", entityId: "claim" },
    ],
  },
  {
    slug: "retail-investing",
    name: "Retail Investing & Brokerage",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "Stocks, ETFs, funds",
    description: "Robinhood-style portfolio, orders, watchlist, compliance holds.",
    examples: ["Robinhood", "E*TRADE", "Webull"],
    productKind: "generic",
    brandName: "Verlin Invest",
    roles: [
      { id: "investor", label: "Investor", description: "Trade & watch", canCreate: true, isDefault: true },
      { id: "advisor", label: "Advisor", description: "Guided portfolios", canCreate: true, canManage: true },
      { id: "compliance", label: "Compliance", description: "Holds & reviews", canManage: true },
    ],
    entities: [
      ent("order", "Order", ["Open", "Filled", "Cancelled", "Held"], ["title", "amount", "description", "status"], [
        { title: "BUY NIFTYBEES", amount: 10000, description: "ETF", status: "Filled" },
        { title: "BUY RELIANCE", amount: 5, description: "Shares", status: "Open" },
        { title: "SELL TCS", amount: 2, description: "Shares", status: "Cancelled" },
        { title: "BUY penny", amount: 500, description: "Held KYC", status: "Held" },
      ]),
      ent("holding", "Holding", ["Gain", "Loss", "Flat"], ["title", "amount", "status"], [
        { title: "NIFTYBEES", amount: 12500, status: "Gain" },
        { title: "Cash", amount: 8000, status: "Flat" },
        { title: "Smallcap fund", amount: 4200, status: "Loss" },
      ]),
    ],
    modules: [
      { id: "home", title: "Portfolio", type: "dashboard", description: "Value" },
      { id: "holdings", title: "Holdings", type: "list", entityId: "holding", description: "Positions" },
      { id: "trade", title: "Trade", type: "form", entityId: "order", description: "Place order" },
      { id: "orders", title: "Orders", type: "board", entityId: "order", description: "Order book" },
      { id: "compliance", title: "Compliance", type: "board", entityId: "order", roleIds: ["compliance"], description: "Holds" },
      { id: "settings", title: "Settings", type: "settings", description: "Risk profile" },
    ],
    workflows: [
      { id: "wf-trade", name: "Place trade", description: "Investor buys", roleId: "investor", steps: ["Trade", "Fill"], moduleId: "trade", entityId: "order" },
      { id: "wf-adv", name: "Advise client", description: "Advisor reviews", roleId: "advisor", steps: ["Portfolio", "Orders"], moduleId: "orders", entityId: "order" },
      { id: "wf-comp", name: "Release hold", description: "Compliance acts", roleId: "compliance", steps: ["Holds", "Release"], moduleId: "compliance", entityId: "order" },
    ],
  },
  {
    slug: "crypto-exchange",
    name: "Cryptocurrency Exchanges & Wallets",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "Buy, sell, store crypto",
    description: "Coinbase-style spot trades, wallets, deposits, compliance freezes.",
    examples: ["Coinbase", "Binance", "Trust Wallet"],
    productKind: "generic",
    brandName: "Verlin Crypto",
    roles: [
      { id: "trader", label: "Trader", description: "Trade assets", canCreate: true, isDefault: true },
      { id: "custody", label: "Custody ops", description: "Wallets", canManage: true, canCreate: true },
      { id: "compliance", label: "Compliance", description: "Freeze accounts", canManage: true },
    ],
    entities: [
      ent("trade", "Trade", ["Open", "Filled", "Cancelled", "Frozen"], ["title", "amount", "description", "status"], [
        { title: "BUY BTC", amount: 0.01, description: "Spot", status: "Filled" },
        { title: "BUY ETH", amount: 0.5, description: "Spot", status: "Open" },
        { title: "SELL SOL", amount: 10, description: "Spot", status: "Cancelled" },
        { title: "BUY meme", amount: 100, description: "Frozen", status: "Frozen" },
      ]),
      ent("wallet", "Wallet asset", ["Available", "In order", "Withdrawing"], ["title", "amount", "status"], [
        { title: "BTC", amount: 0.05, status: "Available" },
        { title: "USDT", amount: 1200, status: "Available" },
        { title: "ETH", amount: 0.2, status: "In order" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Portfolio" },
      { id: "wallets", title: "Wallets", type: "list", entityId: "wallet", description: "Assets" },
      { id: "trade", title: "Trade", type: "form", entityId: "trade", description: "Spot order" },
      { id: "orders", title: "Orders", type: "board", entityId: "trade", description: "Book" },
      { id: "compliance", title: "Compliance", type: "board", entityId: "trade", roleIds: ["compliance", "custody"], description: "Freezes" },
      { id: "settings", title: "Security", type: "settings", description: "2FA & devices" },
    ],
    workflows: [
      { id: "wf-trade", name: "Spot trade", description: "Trader buys crypto", roleId: "trader", steps: ["Trade", "Fill"], moduleId: "trade", entityId: "trade" },
      { id: "wf-cust", name: "Custody move", description: "Ops manages wallets", roleId: "custody", steps: ["Wallets"], moduleId: "wallets", entityId: "wallet" },
      { id: "wf-comp", name: "Freeze asset", description: "Compliance freezes", roleId: "compliance", steps: ["Compliance", "Freeze"], moduleId: "compliance", entityId: "trade" },
    ],
  }
];

export default CATEGORIES;
