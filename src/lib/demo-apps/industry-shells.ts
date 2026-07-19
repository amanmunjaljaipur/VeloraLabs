/**
 * Industry-standard product shells (navigation + footer + IA rationale).
 * Researched from market leaders (Material bottom nav, banking apps, ecom Baymard,
 * SaaS sidebars, healthcare privacy footers, edtech learn paths).
 *
 * Production-serious: real destination labels, legal columns, compliance disclaimers.
 */

import type { StudioNavItem, StudioProductShell } from "@/lib/app-studio/types";
import type { DemoCategoryDef, DemoGroupId } from "./types";

function nav(
  id: string,
  label: string,
  opts: Partial<StudioNavItem> = {}
): StudioNavItem {
  return { id, label, screenId: opts.screenId ?? id, ...opts };
}

function legalFooter(
  brand: string,
  industry: string,
  extraColumns: StudioProductShell["footer"]["columns"] = [],
  disclaimers: string[] = [],
  badges: string[] = []
): StudioProductShell["footer"] {
  return {
    columns: [
      {
        title: "Product",
        links: [
          { label: "Home", screenId: "home" },
          { label: "Features", panel: "about" },
          { label: "Pricing (demo)", panel: "about" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "Help centre", panel: "help" },
          { label: "Contact support", panel: "support" },
          { label: "Status", hrefLabel: "All systems demo" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Terms of use", panel: "terms" },
          { label: "Privacy policy", panel: "privacy" },
          { label: "Security", panel: "security" },
        ],
      },
      ...extraColumns,
    ],
    copyright: `© ${new Date().getFullYear()} ${brand}. All rights reserved.`,
    disclaimers: [
      ...disclaimers,
      `Not a live ${industry} service. Sample data only; session state resets when you leave.`,
    ],
    trustBadges: badges.length
      ? badges
      : ["Secure session (demo)", "Role-based access", "Mock APIs only"],
    supportLine: `Need help? Open Help centre or email support@${brand.toLowerCase().replace(/\s+/g, "")}.demo`,
  };
}

/** Group-level industry IA (Material: 3–5 bottom destinations; sidebar for workplace). */
const GROUP_SHELLS: Record<
  DemoGroupId,
  (def: DemoCategoryDef) => StudioProductShell
> = {
  social: (def) => ({
    navPattern: "bottom-tabs",
    marketBenchmarks: def.examples.slice(0, 3),
    iaRationale:
      "Consumer messaging/social IA: primary surfaces for feed or chats, discovery, create, notifications/activity, and profile - Material bottom nav 3–5 items; safety in More.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home" }),
      nav("inbox", "Chats", { icon: "message", screenId: "inbox" }),
      nav("discover", "Discover", { icon: "compass", screenId: "inbox" }),
      nav("activity", "Activity", { icon: "bell", screenId: "messages" }),
      nav("profile", "You", { icon: "user", screenId: "settings" }),
    ],
    moreNav: [
      nav("compose", "Compose", { screenId: "compose" }),
      nav("new-chat", "New chat", { screenId: "new-chat" }),
      nav("reports", "Safety", { screenId: "reports", roleIds: ["support", "moderator"] }),
      nav("help", "Help", { panel: "help" }),
      nav("privacy", "Privacy", { panel: "privacy" }),
    ],
    utilityNav: [
      nav("help", "Help", { panel: "help" }),
      nav("settings", "Settings", { screenId: "settings" }),
    ],
    footer: legalFooter(def.brandName, "social network", [
      {
        title: "Safety",
        links: [
          { label: "Community guidelines", panel: "legal" },
          { label: "Report abuse", screenId: "reports" },
          { label: "Block & mute", panel: "help" },
        ],
      },
    ], [
      "Do not share real personal data in this demo.",
      "Safety and moderation tools are product surfaces, not legal advice.",
    ], ["End-to-end privacy language (demo)", "Report & block", "Age-appropriate defaults"]),
    emptyStates: {
      list: "No conversations yet. Start a chat to see delivery states.",
      board: "Queue is clear.",
    },
    ctaLabels: { create: "New message", primary: "Open chats" },
  }),

  entertainment: (def) => ({
    navPattern: "bottom-tabs",
    marketBenchmarks: def.examples.slice(0, 3),
    iaRationale:
      "Streaming/media IA (Netflix/Spotify-class): Home/For You, Search/Browse, Library, Downloads or Create, Profile. Content ops behind role gates.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home" }),
      nav("browse", "Browse", { icon: "search", screenId: "catalog" }),
      nav("library", "Library", { icon: "library", screenId: "library" }),
      nav("create", "Create", { icon: "plus", screenId: "create" }),
      nav("profile", "Profile", { icon: "user", screenId: "settings" }),
    ],
    moreNav: [
      nav("studio", "Studio", { screenId: "studio", roleIds: ["creator", "publisher", "ops", "instructor"] }),
      nav("admin", "Catalog ops", { screenId: "admin", roleIds: ["admin", "ops"] }),
      nav("downloads", "Downloads", { screenId: "library" }),
      nav("help", "Help", { panel: "help" }),
    ],
    utilityNav: [
      nav("search", "Search", { screenId: "catalog" }),
      nav("settings", "Settings", { screenId: "settings" }),
    ],
    footer: legalFooter(def.brandName, "media service", [
      {
        title: "Watch & listen",
        links: [
          { label: "Plans (demo)", panel: "about" },
          { label: "Devices", panel: "help" },
          { label: "Audio & subtitles", panel: "help" },
        ],
      },
    ], [
      "Titles and media metadata are sample data - no licensed content streams.",
      "Parental controls language is illustrative.",
    ], ["HD catalog (demo)", "Profiles", "Content advisory labels"]),
    emptyStates: {
      list: "Your library is empty. Save something from Browse.",
      board: "No titles in this status.",
    },
    ctaLabels: { create: "Add title", primary: "Continue watching" },
  }),

  fintech: (def) => ({
    navPattern: "hybrid",
    marketBenchmarks: def.examples.slice(0, 3),
    iaRationale:
      "India digital banking / wallets (PhonePe, bank apps, Revolut-class): Home (money overview), Payments/Transfer, Cards or Invest, History, Account/More. Ops queues role-gated. Footer carries security + grievance-style links.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home" }),
      nav("pay", "Payments", { icon: "send", screenId: "send" }),
      nav("accounts", "Accounts", { icon: "wallet", screenId: "accounts" }),
      nav("history", "History", { icon: "list", screenId: "history" }),
      nav("more", "More", { icon: "menu", screenId: "settings" }),
    ],
    moreNav: [
      nav("cards", "Cards", { screenId: "cards" }),
      nav("bills", "Bills", { screenId: "bills" }),
      nav("support", "Support", { screenId: "support" }),
      nav("ops", "Ops queue", { screenId: "ops", roleIds: ["ops", "admin", "rm", "compliance", "adjuster"] }),
      nav("security", "Security", { panel: "security" }),
      nav("legal", "Legal", { panel: "legal" }),
    ],
    utilityNav: [
      nav("support", "Support", { panel: "support" }),
      nav("security", "Security", { panel: "security" }),
      nav("settings", "Settings", { screenId: "settings" }),
    ],
    footer: legalFooter(
      def.brandName,
      "financial service",
      [
        {
          title: "Banking",
          links: [
            { label: "Accounts", screenId: "accounts" },
            { label: "Payments", screenId: "send" },
            { label: "Cards", screenId: "cards" },
            { label: "Raise dispute", screenId: "support" },
          ],
        },
        {
          title: "Compliance",
          links: [
            { label: "Privacy", panel: "privacy" },
            { label: "Security", panel: "security" },
            { label: "Grievance (demo)", panel: "support" },
            { label: "Terms", panel: "terms" },
          ],
        },
      ],
      [
        "This is not a licensed bank, NBFC, or payment system. No real money moves.",
        "Balances, UPI-style flows, OTP, and KYC are simulated for product demos only.",
        "Not investment, insurance, or tax advice.",
      ],
      ["Encryption (demo)", "2FA language", "Transaction alerts", "No real funds"]
    ),
    emptyStates: {
      list: "No transactions in this view yet.",
      form: "Enter details carefully. Mock validation applies.",
    },
    ctaLabels: { create: "Pay now", primary: "Send money", transfer: "Continue" },
  }),

  ecommerce: (def) => ({
    navPattern: "bottom-tabs",
    marketBenchmarks: def.examples.slice(0, 3),
    iaRationale:
      "Marketplace / retail app IA (Amazon/Flipkart/Swiggy-class): Home, Categories/Search, Cart or Orders, Account; sellers get Catalog & Fulfilment. Baymard: category-led browse, clear order tracking.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home" }),
      nav("shop", "Shop", { icon: "search", screenId: "catalog" }),
      nav("orders", "Orders", { icon: "package", screenId: "orders" }),
      nav("cart", "Cart", { icon: "cart", screenId: "cart" }),
      nav("account", "Account", { icon: "user", screenId: "settings" }),
    ],
    moreNav: [
      nav("wishlist", "Wishlist", { screenId: "wishlist" }),
      nav("sell", "Sell", { screenId: "sell", roleIds: ["seller", "merchant", "owner"] }),
      nav("fulfil", "Fulfilment", { screenId: "fulfil", roleIds: ["seller", "restaurant", "picker", "rider"] }),
      nav("support", "Help & returns", { screenId: "support" }),
      nav("admin", "Ops", { screenId: "admin", roleIds: ["admin", "support", "ops"] }),
    ],
    utilityNav: [
      nav("support", "Help", { panel: "help" }),
      nav("settings", "Settings", { screenId: "settings" }),
    ],
    footer: legalFooter(def.brandName, "commerce platform", [
      {
        title: "Shop",
        links: [
          { label: "All categories", screenId: "catalog" },
          { label: "Your orders", screenId: "orders" },
          { label: "Wishlist", screenId: "wishlist" },
          { label: "Track order", screenId: "orders" },
        ],
      },
      {
        title: "Sell with us",
        links: [
          { label: "Seller hub", screenId: "sell" },
          { label: "Fulfilment", screenId: "fulfil" },
          { label: "Fees (demo)", panel: "about" },
        ],
      },
      {
        title: "Consumer",
        links: [
          { label: "Returns policy", panel: "legal" },
          { label: "Cancellation", panel: "help" },
          { label: "Contact us", panel: "support" },
        ],
      },
    ], [
      "Prices and inventory are sample data. No real checkout or payment capture.",
      "Delivery ETAs are illustrative product copy only.",
    ], ["Buyer protection (demo)", "Secure checkout language", "GST invoice (demo)"]),
    emptyStates: {
      list: "No orders yet. Place one from Shop to practise tracking.",
      board: "No items in this fulfilment stage.",
    },
    ctaLabels: { create: "Place order", primary: "Add to cart" },
  }),

  utilities: (def) => ({
    navPattern: "bottom-tabs",
    marketBenchmarks: def.examples.slice(0, 3),
    iaRationale:
      "Utility/security apps (browsers, vaults, VPN, weather): Home/status, primary tool surface, library/history, alerts, Settings. Admin policies in More.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home" }),
      nav("main", "Workspace", { icon: "layout", screenId: "vault" }),
      nav("library", "Library", { icon: "folder", screenId: "library" }),
      nav("alerts", "Alerts", { icon: "bell", screenId: "alerts" }),
      nav("settings", "Settings", { icon: "settings", screenId: "settings" }),
    ],
    moreNav: [
      nav("admin", "Admin", { screenId: "admin", roleIds: ["admin", "ops", "it"] }),
      nav("security", "Security centre", { panel: "security" }),
      nav("help", "Help", { panel: "help" }),
    ],
    utilityNav: [
      nav("security", "Security", { panel: "security" }),
      nav("help", "Help", { panel: "help" }),
    ],
    footer: legalFooter(def.brandName, "utility software", [
      {
        title: "Security",
        links: [
          { label: "Security centre", panel: "security" },
          { label: "Privacy", panel: "privacy" },
          { label: "Responsible disclosure", panel: "legal" },
        ],
      },
    ], [
      "Never store real production secrets, passwords, or VPN credentials in this demo.",
      "Security claims are educational product language only.",
    ], ["Local demo vault", "No production secrets", "Admin policy language"]),
    emptyStates: {
      list: "Nothing saved yet.",
    },
    ctaLabels: { create: "Add item", primary: "Open workspace" },
  }),

  productivity: (def) => ({
    navPattern: "sidebar",
    marketBenchmarks: def.examples.slice(0, 3),
    iaRationale:
      "Workplace SaaS IA (Slack/Asana/Notion-class): persistent left nav with Home, primary work object, activity, and admin; settings as utility. Desktop-first sidebar; mobile collapses to tabs.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home", section: "Workspace" }),
      nav("work", "Work", { icon: "check", screenId: "work", section: "Workspace" }),
      nav("inbox", "Inbox", { icon: "inbox", screenId: "inbox", section: "Workspace" }),
      nav("compose", "Compose", { icon: "plus", screenId: "compose", section: "Create" }),
      nav("team", "Team", { icon: "users", screenId: "team", section: "People" }),
      nav("admin", "Admin", { icon: "shield", screenId: "admin", section: "Admin", roleIds: ["admin", "lead", "ops"] }),
      nav("settings", "Settings", { icon: "settings", screenId: "settings", section: "Account" }),
    ],
    moreNav: [
      nav("templates", "Templates", { screenId: "templates" }),
      nav("help", "Help", { panel: "help" }),
      nav("security", "Security", { panel: "security" }),
    ],
    utilityNav: [
      nav("help", "Help", { panel: "help" }),
      nav("settings", "Settings", { screenId: "settings" }),
    ],
    footer: legalFooter(def.brandName, "workplace product", [
      {
        title: "Workspace",
        links: [
          { label: "Home", screenId: "home" },
          { label: "Inbox", screenId: "inbox" },
          { label: "Admin", screenId: "admin" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", panel: "about" },
          { label: "Security", panel: "security" },
          { label: "Privacy", panel: "privacy" },
          { label: "Terms", panel: "terms" },
        ],
      },
    ], [
      "Workspace data is mock. No real SSO or SCIM in this demo.",
      "Admin policies are illustrative for product design reviews.",
    ], ["SSO language (demo)", "Audit log (demo)", "Role-based modules"]),
    emptyStates: {
      list: "Inbox zero - or create your first item.",
      board: "No cards in this column.",
    },
    ctaLabels: { create: "New item", primary: "Start task" },
  }),

  education: (def) => ({
    navPattern: "bottom-tabs",
    marketBenchmarks: def.examples.slice(0, 3),
    iaRationale:
      "Edtech IA (Duolingo/Coursera/Classroom-class): Learn/Home, Practice or Path, Progress, Profile; teachers get Class & Gradebook in More. Finish-line outcomes over vanity metrics.",
    primaryNav: [
      nav("home", "Learn", { icon: "home", screenId: "home" }),
      nav("path", "Path", { icon: "map", screenId: "path" }),
      nav("practice", "Practice", { icon: "book", screenId: "practice" }),
      nav("progress", "Progress", { icon: "chart", screenId: "progress" }),
      nav("profile", "Profile", { icon: "user", screenId: "settings" }),
    ],
    moreNav: [
      nav("class", "Class", { screenId: "class", roleIds: ["teacher", "instructor", "coach"] }),
      nav("grade", "Gradebook", { screenId: "grade", roleIds: ["teacher"] }),
      nav("studio", "Studio", { screenId: "studio", roleIds: ["instructor", "author", "admin"] }),
      nav("curriculum", "Curriculum", { screenId: "curriculum", roleIds: ["admin"] }),
      nav("help", "Help", { panel: "help" }),
    ],
    utilityNav: [
      nav("help", "Help", { panel: "help" }),
      nav("settings", "Settings", { screenId: "settings" }),
    ],
    footer: legalFooter(def.brandName, "education product", [
      {
        title: "Learn",
        links: [
          { label: "Today", screenId: "home" },
          { label: "Path", screenId: "path" },
          { label: "Practice", screenId: "practice" },
          { label: "Certificates (demo)", panel: "about" },
        ],
      },
      {
        title: "For educators",
        links: [
          { label: "Class view", screenId: "class" },
          { label: "Curriculum", screenId: "curriculum" },
          { label: "Teacher guide", panel: "help" },
        ],
      },
    ], [
      "Not an accredited institution. Certificates are demo status only.",
      "Student data is fictional - do not enter real minors’ PII.",
    ], ["Progress tracking", "Teacher roles", "Accessible labels"]),
    emptyStates: {
      list: "No lessons due. Open Path to start one.",
      board: "All clear in this lane.",
    },
    ctaLabels: { create: "Start lesson", primary: "Continue learning" },
  }),

  health: (def) => ({
    navPattern: "bottom-tabs",
    marketBenchmarks: def.examples.slice(0, 3),
    iaRationale:
      "Health & wellness IA (Apple Health/Headspace/telehealth-class): Today, Log, Insights, Care, Profile. Clinical disclaimers mandatory in footer. Clinician queues role-gated.",
    primaryNav: [
      nav("home", "Today", { icon: "home", screenId: "home" }),
      nav("log", "Log", { icon: "plus", screenId: "log" }),
      nav("insights", "Insights", { icon: "chart", screenId: "insights" }),
      nav("care", "Care", { icon: "heart", screenId: "care" }),
      nav("profile", "You", { icon: "user", screenId: "settings" }),
    ],
    moreNav: [
      nav("coach", "Coach", { screenId: "coach", roleIds: ["coach", "clinician", "teacher"] }),
      nav("clinician", "Clinician", { screenId: "clinician", roleIds: ["clinician", "ops"] }),
      nav("privacy", "Privacy", { panel: "privacy" }),
      nav("help", "Help", { panel: "help" }),
    ],
    utilityNav: [
      nav("privacy", "Privacy", { panel: "privacy" }),
      nav("settings", "Settings", { screenId: "settings" }),
    ],
    footer: legalFooter(def.brandName, "health product", [
      {
        title: "Your data",
        links: [
          { label: "Privacy controls", panel: "privacy" },
          { label: "Export (demo)", panel: "help" },
          { label: "Delete data (demo)", panel: "legal" },
        ],
      },
      {
        title: "Care",
        links: [
          { label: "When to seek emergency care", panel: "legal" },
          { label: "Talk to a clinician (demo)", screenId: "care" },
          { label: "Support", panel: "support" },
        ],
      },
    ], [
      "Not a medical device. Not diagnosis, treatment, or emergency care.",
      "If you have a medical emergency, call local emergency services - do not use this demo.",
      "Health logs are fictional sample data only.",
    ], ["Privacy-first defaults", "No clinical claims", "Sensitive-data caution"]),
    emptyStates: {
      list: "No logs yet. Add today’s entry when ready.",
    },
    ctaLabels: { create: "Log entry", primary: "Start session" },
  }),

  travel: (def) => ({
    navPattern: "bottom-tabs",
    marketBenchmarks: def.examples.slice(0, 3),
    iaRationale:
      "Travel & mobility IA (Uber/Google Maps/Booking-class): Home, Book/Search, Trips, Saved, Account. Driver/agent ops in More. Clear cancel/complete statuses.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home" }),
      nav("book", "Book", { icon: "search", screenId: "book" }),
      nav("trips", "Trips", { icon: "map", screenId: "trips" }),
      nav("saved", "Saved", { icon: "heart", screenId: "saved" }),
      nav("account", "Account", { icon: "user", screenId: "settings" }),
    ],
    moreNav: [
      nav("driver", "Driver", { screenId: "driver", roleIds: ["driver", "rider"] }),
      nav("agent", "Agent", { screenId: "agent", roleIds: ["agent", "ops"] }),
      nav("ops", "Ops", { screenId: "ops", roleIds: ["ops", "admin"] }),
      nav("help", "Help", { panel: "help" }),
      nav("safety", "Safety", { panel: "security" }),
    ],
    utilityNav: [
      nav("help", "Help", { panel: "help" }),
      nav("settings", "Settings", { screenId: "settings" }),
    ],
    footer: legalFooter(def.brandName, "travel service", [
      {
        title: "Travel",
        links: [
          { label: "Book", screenId: "book" },
          { label: "Your trips", screenId: "trips" },
          { label: "Saved places", screenId: "saved" },
        ],
      },
      {
        title: "Safety",
        links: [
          { label: "Safety toolkit", panel: "security" },
          { label: "Emergency (demo)", panel: "help" },
          { label: "Support", panel: "support" },
        ],
      },
    ], [
      "No real bookings, rides, or maps routing. Fares and ETAs are sample copy.",
      "Location pins are illustrative only.",
    ], ["Trip tracking (demo)", "Safety share language", "Cancel anytime (demo)"]),
    emptyStates: {
      list: "No trips yet. Book one to practise the full status path.",
    },
    ctaLabels: { create: "Book now", primary: "Request ride" },
  }),
};

/** Slug-specific overrides for closer market parity. */
const SLUG_OVERRIDES: Partial<
  Record<string, (def: DemoCategoryDef, base: StudioProductShell) => StudioProductShell>
> = {
  "instant-messaging": (def, base) => ({
    ...base,
    marketBenchmarks: ["WhatsApp", "Telegram", "Signal"],
    iaRationale:
      "WhatsApp-class: Chats, Updates, Communities, Calls pattern simplified to Chats / Communities / Calls / Settings with Safety for support roles.",
    primaryNav: [
      nav("home", "Chats", { icon: "message", screenId: "home" }),
      nav("inbox", "All chats", { icon: "list", screenId: "inbox" }),
      nav("messages", "Thread", { icon: "message", screenId: "messages" }),
      nav("compose", "New", { icon: "plus", screenId: "compose" }),
      nav("settings", "Settings", { icon: "settings", screenId: "settings" }),
    ],
  }),
  "digital-banking": (def, base) => ({
    ...base,
    marketBenchmarks: ["HDFC Bank App", "Revolut", "PhonePe"],
    iaRationale:
      "Retail digital bank: Home balances, Pay/Transfer, Accounts, Cards, More (bills, support, statements). Hybrid desktop sidebar + mobile tabs.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home" }),
      nav("send", "Pay", { icon: "send", screenId: "send" }),
      nav("accounts", "Accounts", { icon: "wallet", screenId: "accounts" }),
      nav("cards", "Cards", { icon: "card", screenId: "cards" }),
      nav("more", "More", { icon: "menu", screenId: "settings" }),
    ],
    moreNav: [
      nav("bills", "Bills & recharges", { screenId: "bills" }),
      nav("history", "Statements", { screenId: "history" }),
      nav("support", "Support", { screenId: "support" }),
      nav("ops", "Ops", { screenId: "ops", roleIds: ["ops", "admin"] }),
      nav("security", "Security", { panel: "security" }),
    ],
  }),
  "mobile-wallets": (def, base) => ({
    ...base,
    marketBenchmarks: ["PhonePe", "Google Pay", "Paytm"],
    iaRationale:
      "India UPI wallet: Home, Scan/Pay, History, Account; merchant settlement for merchant role.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home" }),
      nav("pay", "Pay", { icon: "send", screenId: "pay" }),
      nav("history", "History", { icon: "list", screenId: "history" }),
      nav("rewards", "Rewards", { icon: "gift", screenId: "rewards" }),
      nav("account", "Account", { icon: "user", screenId: "settings" }),
    ],
  }),
  "language-learning": (def, base) => ({
    ...base,
    marketBenchmarks: ["Duolingo", "Babbel", "Memrise"],
    iaRationale:
      "Duolingo-class: Learn, Practice, Leaderboards/Progress, Profile; teacher Class in More.",
    primaryNav: [
      nav("home", "Learn", { icon: "home", screenId: "home" }),
      nav("path", "Path", { icon: "map", screenId: "path" }),
      nav("practice", "Practice", { icon: "book", screenId: "practice" }),
      nav("class", "Class", { icon: "users", screenId: "class" }),
      nav("profile", "Profile", { icon: "user", screenId: "settings" }),
    ],
  }),
  "food-delivery": (def, base) => ({
    ...base,
    marketBenchmarks: ["Swiggy", "Zomato", "DoorDash"],
    iaRationale:
      "Food delivery: Home/restaurants, Search, Orders, Account; kitchen & rider apps as roles.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home" }),
      nav("shop", "Restaurants", { icon: "search", screenId: "catalog" }),
      nav("orders", "Orders", { icon: "package", screenId: "orders" }),
      nav("cart", "Cart", { icon: "cart", screenId: "cart" }),
      nav("account", "Account", { icon: "user", screenId: "settings" }),
    ],
  }),
  "ride-sharing": (def, base) => ({
    ...base,
    marketBenchmarks: ["Uber", "Ola", "Lyft"],
    iaRationale:
      "Ride-hail: Home (where to), Activity/Trips, Account; driver mode as role.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home" }),
      nav("book", "Ride", { icon: "car", screenId: "book" }),
      nav("trips", "Activity", { icon: "list", screenId: "trips" }),
      nav("saved", "Places", { icon: "map", screenId: "saved" }),
      nav("account", "Account", { icon: "user", screenId: "settings" }),
    ],
  }),
  "task-project-management": (def, base) => ({
    ...base,
    marketBenchmarks: ["Asana", "Jira", "Linear"],
    navPattern: "sidebar",
    iaRationale:
      "PM tool sidebar: Home, My tasks, Projects, Inbox, Goals; portfolios for admin.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home", section: "Plan" }),
      nav("work", "My tasks", { icon: "check", screenId: "work", section: "Plan" }),
      nav("projects", "Projects", { icon: "folder", screenId: "projects", section: "Plan" }),
      nav("inbox", "Inbox", { icon: "inbox", screenId: "inbox", section: "Plan" }),
      nav("admin", "Portfolio", { icon: "chart", screenId: "admin", section: "Lead", roleIds: ["lead", "admin"] }),
      nav("settings", "Settings", { icon: "settings", screenId: "settings", section: "Account" }),
    ],
  }),
  telemedicine: (def, base) => ({
    ...base,
    marketBenchmarks: ["Practo", "Teladoc", "Amwell"],
    iaRationale:
      "Telehealth: Home, Book visit, Visits, Prescriptions/Care, Profile; clinician queue role-gated. Strong medical disclaimers.",
    primaryNav: [
      nav("home", "Home", { icon: "home", screenId: "home" }),
      nav("book", "Book", { icon: "calendar", screenId: "book" }),
      nav("visits", "Visits", { icon: "list", screenId: "visits" }),
      nav("care", "Care", { icon: "heart", screenId: "care" }),
      nav("profile", "You", { icon: "user", screenId: "settings" }),
    ],
  }),
};

/**
 * Resolve production shell for a category (group baseline + slug override).
 */
export function resolveIndustryShell(def: DemoCategoryDef): StudioProductShell {
  const base = GROUP_SHELLS[def.group](def);
  const override = SLUG_OVERRIDES[def.slug];
  const shell = override ? override(def, base) : base;

  // Brand-specific copyright
  return {
    ...shell,
    footer: {
      ...shell.footer,
      copyright: shell.footer.copyright.replace(def.brandName, def.brandName),
      supportLine: `Support · ${def.brandName} Help centre · demo only`,
    },
  };
}

/**
 * Map nav screenId to best existing module when ids differ.
 */
export function resolveNavScreenId(
  preferred: string | undefined,
  moduleIds: Set<string>
): string | undefined {
  if (!preferred) return undefined;
  if (moduleIds.has(preferred)) return preferred;

  const aliases: Record<string, string[]> = {
    home: ["home", "today", "learn", "dashboard"],
    inbox: ["inbox", "chats", "messages", "work"],
    messages: ["messages", "inbox", "compose"],
    compose: ["compose", "new-chat", "create", "add", "play", "submit", "enroll"],
    catalog: ["catalog", "shop", "browse", "library", "path", "games"],
    library: ["library", "deck", "shelf", "files", "vault", "games"],
    orders: ["orders", "trips", "history", "work", "visits"],
    cart: ["cart", "checkout"],
    accounts: ["accounts", "wallet", "home"],
    send: ["send", "pay", "transfer", "compose"],
    pay: ["pay", "send", "transfer"],
    history: ["history", "orders", "trips", "messages", "work"],
    cards: ["cards", "accounts"],
    bills: ["bills", "pay"],
    support: ["support", "reports", "help"],
    ops: ["ops", "admin", "reports"],
    path: ["path", "work", "games", "catalog"],
    practice: ["practice", "play", "submit", "enroll", "add"],
    progress: ["progress", "home", "class"],
    class: ["class", "teach", "coach"],
    grade: ["grade", "class"],
    studio: ["studio", "create", "curriculum"],
    curriculum: ["curriculum", "admin", "studio"],
    log: ["log", "add", "play", "submit", "create"],
    insights: ["insights", "home", "progress"],
    care: ["care", "coach", "clinician", "home"],
    book: ["book", "create", "enroll", "new-chat", "play"],
    trips: ["trips", "orders", "history", "work"],
    saved: ["saved", "wishlist", "library", "deck"],
    vault: ["vault", "library", "files", "work", "deck"],
    alerts: ["alerts", "reports", "inbox"],
    work: ["work", "projects", "inbox", "path", "games"],
    projects: ["projects", "work", "studio"],
    team: ["team", "class", "admin"],
    admin: ["admin", "ops", "curriculum"],
    settings: ["settings"],
    sell: ["sell", "create", "studio"],
    fulfil: ["fulfil", "ops", "orders"],
    wishlist: ["wishlist", "saved", "library"],
    rewards: ["rewards", "home"],
    visits: ["visits", "orders", "work"],
    clinician: ["clinician", "coach", "admin"],
    coach: ["coach", "class", "teach"],
    driver: ["driver", "ops"],
    agent: ["agent", "ops", "admin"],
    templates: ["templates", "create"],
  };

  for (const alt of aliases[preferred] || []) {
    if (moduleIds.has(alt)) return alt;
  }
  // fuzzy: any module id containing key
  for (const id of moduleIds) {
    if (id.includes(preferred) || preferred.includes(id)) return id;
  }
  return moduleIds.has("home") ? "home" : [...moduleIds][0];
}

export function panelContent(
  panel: NonNullable<StudioNavItem["panel"]>,
  brand: string,
  shell: StudioProductShell
): { title: string; body: string[] } {
  switch (panel) {
    case "help":
      return {
        title: "Help centre",
        body: [
          `Welcome to ${brand} support. This is a production-style help surface for demos.`,
          "Start on Home, complete one primary workflow, then switch roles top-right to see staff tools.",
          "Use the API path control (Auto / Always OK / Always fail) to rehearse success and error UX.",
          shell.footer.supportLine,
          "Still stuck? Open Support from the footer or More menu.",
        ],
      };
    case "legal":
      return {
        title: "Legal",
        body: [
          `${brand} demo terms overview.`,
          ...shell.footer.disclaimers,
          "Full legal agreements would be linked here in a live product (Terms, Privacy, Cookie preferences).",
        ],
      };
    case "privacy":
      return {
        title: "Privacy policy (summary)",
        body: [
          "We designed this demo to avoid collecting real personal data.",
          "Do not enter real phone numbers, health records, passwords, or financial credentials.",
          "Session data stays in your browser memory for this demo and is not a production database.",
          "A live product would document controllers, processors, retention, and user rights (access/delete) here.",
        ],
      };
    case "terms":
      return {
        title: "Terms of use (summary)",
        body: [
          `You are using an interactive demonstration of ${brand}.`,
          "No real contracts, payments, medical advice, or regulated services are provided.",
          "Features may change; availability is not guaranteed.",
          "By continuing you acknowledge this is an interactive product demonstration with sample data.",
        ],
      };
    case "security":
      return {
        title: "Security centre",
        body: [
          "Production apps publish security posture here: encryption in transit, session controls, 2FA, and vulnerability reporting.",
          "This demo uses mock APIs and local state - treat nothing as a secure vault.",
          "Role-based module visibility simulates least-privilege access.",
          "Report demo issues via the product owner - not a real bug bounty endpoint.",
        ],
      };
    case "about":
      return {
        title: `About ${brand}`,
        body: [
          shell.iaRationale,
          `Market benchmarks informing this IA: ${shell.marketBenchmarks.join(", ")}.`,
          "Multi-role interactive product shell for realistic walkthroughs and demos.",
        ],
      };
    case "support":
      return {
        title: "Contact support",
        body: [
          shell.footer.supportLine,
          "In a live product: chat, phone, and ticket SLA would appear here.",
          "For this demo, open any Support/Reports module for your role, or use Help centre.",
          "Include your role name and the step that failed when describing issues.",
        ],
      };
    default:
      return { title: "Info", body: ["No content."] };
  }
}
