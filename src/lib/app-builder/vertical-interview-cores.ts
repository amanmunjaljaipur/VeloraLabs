/**
 * Vertical-aware starter interview cores + chips.
 * Shop chips must NEVER leak into banking, insurance, resume, etc.
 */

import type { InterviewQuestion } from "@/lib/app-builder/types";

export type InterviewVerticalKey =
  | "ecom"
  | "digital-banking"
  | "insurance"
  | "resume-career"
  | "booking"
  | "tuition"
  | "portfolio"
  | "generic";

/** Map extensionId / appKind → interview pack key */
export function interviewVerticalKey(
  extensionId: string,
  appKind?: string
): InterviewVerticalKey {
  const id = (extensionId || appKind || "").toLowerCase();
  if (id.includes("bank") || id.includes("fintech") || id === "digital-banking") {
    return "digital-banking";
  }
  if (id.includes("insurance")) return "insurance";
  if (id.includes("resume") || id.includes("career")) return "resume-career";
  if (id.includes("book")) return "booking";
  if (id.includes("tuition") || id.includes("coach")) return "tuition";
  if (id.includes("portfolio")) return "portfolio";
  if (id === "ecom-local-shop" || id === "ecom") return "ecom";
  return "generic";
}

const LOGO_Q: InterviewQuestion = {
  id: "logoPreference",
  label: "Do you already have a logo, or should we design one for you?",
  helpText: "Skip if you want a simple name mark for now.",
  required: false,
  selectMode: "single",
  suggestions: [
    "Please design a logo for me",
    "I will paste my logo link below",
    "Use my name as a simple logo for now",
  ],
  allowCustom: true,
  placeholder: "Or paste https://… link to your logo image",
};

function brandName(nameWord: string): InterviewQuestion {
  return {
    id: "brandName",
    label: `What should we call this ${nameWord}?`,
    helpText: "Short name at the top of the app. You can skip and we will invent a working name.",
    required: false,
    selectMode: "free",
    allowCustom: true,
    suggestions: [],
  };
}

function contactQ(help?: string): InterviewQuestion {
  return {
    id: "contact",
    label: "How should people reach you or support?",
    helpText: help || "Phone, WhatsApp, email, or in-app support — optional if you skip.",
    required: false,
    selectMode: "free",
    allowCustom: true,
    placeholder: "e.g. +91… or support@…",
  };
}

/** Shop-generic chips that must not appear for banking / insurance / etc. */
export const SHOP_LEAK_CHIPS = [
  "everyday customers",
  "students",
  "parents",
  "job seekers",
  "shoppers",
  "handmade",
  "whatsapp order",
  "local & fresh",
];

export function looksLikeShopAudienceChips(suggestions: string[] | undefined): boolean {
  if (!suggestions?.length) return false;
  const lower = suggestions.map((s) => s.toLowerCase());
  const shopHits = lower.filter((s) =>
    SHOP_LEAK_CHIPS.some((leak) => s.includes(leak) || leak.includes(s))
  ).length;
  // "Students" + "Parents" + "Job seekers" style packs without bank/insurance language
  const hasEducationShop =
    lower.some((s) => s.includes("student")) && lower.some((s) => s.includes("parent"));
  const hasBankingLanguage = lower.some((s) =>
    /bank|account|sme|salary|retail|premium|policy|claim|job seeker|hiring|client|patient|salon/.test(
      s
    )
  );
  if (hasEducationShop && !hasBankingLanguage) return true;
  return shopHits >= 2 && !hasBankingLanguage;
}

/** Per-vertical core questions (ids stay stable for generation) */
export function verticalCoreQuestions(key: InterviewVerticalKey): InterviewQuestion[] {
  switch (key) {
    case "digital-banking":
      return [
        brandName("banking product"),
        {
          id: "whoFor",
          label: "Who is this banking product mainly for?",
          helpText:
            "Retail users, salary accounts, small businesses… Skip if you want a general India audience.",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Everyday retail customers",
            "Salary account holders",
            "Young first-time bank users",
            "Small business / SME owners",
            "NRI / overseas Indians",
            "Premium / high-balance customers",
          ],
        },
        {
          id: "mainJob",
          label: "What is the #1 job on day one?",
          helpText: "One clear outcome for your first release.",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Open savings / account online",
            "Send money (UPI / transfer)",
            "See balance & recent transactions",
            "Apply for card or loan",
            "Build trust (security & compliance story)",
          ],
        },
        {
          id: "mustHaveFeatures",
          label: "Which modules matter most on day one?",
          helpText: "Pick a few — we can add more later.",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Accounts overview",
            "Transactions list",
            "Payments / UPI",
            "Cards",
            "Statements download",
            "Profile & security",
            "Marketing homepage + trust",
          ],
        },
        {
          id: "trustSafety",
          label: "What should customers feel safe about?",
          helpText: "Banks win on trust — keep language simple.",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "2FA / OTP on payments",
            "Clear fraud / lock card help",
            "RBI / regulated language (simple)",
            "Transparent fees",
            "24×7 support path",
          ],
        },
        {
          id: "userJourney",
          label: "How should a new user get started?",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Browse product site → Apply / Get started",
            "Sign up → KYC later → use wallet",
            "Login to demo dashboard first",
            "Compare plans then contact sales",
          ],
        },
        contactQ("Support phone, email, or chat — optional."),
        LOGO_Q,
      ];

    case "insurance":
      return [
        brandName("insurance product"),
        {
          id: "whoFor",
          label: "Who is this insurance product mainly for?",
          helpText: "Families, individuals, employers… Skip if unsure.",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Individuals & families",
            "Young professionals",
            "Parents covering dependents",
            "Small business owners",
            "Employers (group cover)",
            "Senior citizens",
          ],
        },
        {
          id: "mainJob",
          label: "What is the #1 job on day one?",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Explain plans simply",
            "Get a quote / lead",
            "Compare benefits",
            "Claims FAQ & how to claim",
            "Build trust in the brand",
          ],
        },
        {
          id: "mustHaveFeatures",
          label: "Which pages or tools matter most?",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Plan cards & benefits",
            "Premium / quote form",
            "Claims process steps",
            "Hospital network / coverage FAQ",
            "Contact advisor",
          ],
        },
        {
          id: "trustSafety",
          label: "What builds trust for buyers?",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Claim settlement story",
            "Simple exclusions explained",
            "Licensed / partner insurer note",
            "Clear waiting periods",
            "Human support contact",
          ],
        },
        contactQ(),
        LOGO_Q,
      ];

    case "resume-career":
      return [
        brandName("career app"),
        {
          id: "whoFor",
          label: "Who is this career tool mainly for?",
          helpText: "Students, mid-career switchers, recruiters…",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "College students & freshers",
            "Working professionals",
            "Career switchers",
            "Job seekers after a break",
            "Recruiters reviewing profiles",
          ],
        },
        {
          id: "mainJob",
          label: "What is the #1 job on day one?",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Update resume with better wording",
            "Tailor resume to a job description",
            "Improve LinkedIn summary",
            "Export a clean PDF",
            "Show a public portfolio page",
          ],
        },
        {
          id: "mustHaveFeatures",
          label: "Which features matter most?",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Resume sections editor",
            "AI rewrite suggestions",
            "Templates",
            "Tips / checklist",
            "Export / share link",
          ],
        },
        contactQ(),
        LOGO_Q,
      ];

    case "booking":
      return [
        brandName("booking site"),
        {
          id: "whoFor",
          label: "Who books with you most often?",
          helpText: "Patients, salon clients, corporate… Skip if mixed.",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Walk-in local clients",
            "Repeat regulars",
            "New customers from Instagram",
            "Families / couples",
            "Corporate or groups",
          ],
        },
        {
          id: "mainJob",
          label: "What is the #1 job on day one?",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Show services & prices",
            "Request a booking time",
            "Message on WhatsApp to book",
            "Show hours & location",
            "Reduce no-shows with clear rules",
          ],
        },
        contactQ("Phone or WhatsApp for bookings."),
        LOGO_Q,
      ];

    case "tuition":
      return [
        brandName("tuition centre"),
        {
          id: "whoFor",
          label: "Who is this mainly for?",
          helpText: "Students, parents, or both.",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "School students (6–12)",
            "College students",
            "Parents deciding",
            "Both students and parents",
            "Competitive exam aspirants",
          ],
        },
        {
          id: "mainJob",
          label: "What is the #1 job on day one?",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Show subjects & batches",
            "Show fees clearly",
            "Send an enquiry",
            "Book a demo class",
            "Share results / trust",
          ],
        },
        contactQ(),
        LOGO_Q,
      ];

    case "portfolio":
      return [
        brandName("portfolio"),
        {
          id: "whoFor",
          label: "Who should hire or follow you?",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Local clients",
            "Startups",
            "Agencies",
            "Personal brand followers",
            "Recruiters",
          ],
        },
        {
          id: "mainJob",
          label: "What is the #1 job on day one?",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Show best work",
            "About / story",
            "Contact / hire me",
            "Services & rates",
          ],
        },
        contactQ(),
        LOGO_Q,
      ];

    case "ecom":
      return [
        brandName("shop"),
        {
          id: "whoFor",
          label: "Who is this mainly for?",
          helpText: "Neighbours, gift buyers, wholesale… Skip if unsure.",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Neighbours & local buyers",
            "Gift shoppers",
            "Regulars who reorder",
            "Office / bulk buyers",
            "Online-first customers",
          ],
        },
        {
          id: "mainJob",
          label: "What is the #1 job this shop must do on day one?",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Show products with prices",
            "WhatsApp order easily",
            "Share link on Instagram",
            "Show address & hours",
            "Look trustworthy",
          ],
        },
        contactQ("WhatsApp or phone for orders."),
        LOGO_Q,
      ];

    default:
      return [
        brandName("product"),
        {
          id: "whoFor",
          label: "Who is this mainly for?",
          helpText: "Describe the main users in plain words. Skip if unsure.",
          required: false,
          selectMode: "multi",
          allowCustom: true,
          suggestions: [
            "Everyday end users",
            "Business owners",
            "Teams inside a company",
            "Professionals in one field",
            "Anyone who finds us online",
          ],
        },
        {
          id: "mainJob",
          label: "What is the #1 job this app must do on day one?",
          helpText: "One clear outcome. Everything else can wait.",
          required: false,
          selectMode: "free",
          allowCustom: true,
          multiline: true,
          suggestions: [],
        },
        contactQ(),
        LOGO_Q,
      ];
  }
}

/** Shop offline workflow — ecom only */
export const ECOM_WORKFLOW_DEFAULTS: InterviewQuestion[] = [
  {
    id: "offlineDay",
    label: "Walk us through a normal day in your business (offline)",
    helpText:
      "From opening to closing — what do you and your customers actually do? No perfect English needed.",
    required: false,
    multiline: true,
    selectMode: "free",
    suggestions: [
      "Open shop → customers walk in → bill → close",
      "Take orders on phone/WhatsApp → prepare → hand over",
      "Morning prep → peak evening rush → night packing",
      "I work from home; people message when they need something",
    ],
    allowCustom: true,
    placeholder: "e.g. Morning I set the stall… customers ask price…",
  },
  {
    id: "customerSteps",
    label: "When a customer wants to buy or book, what steps happen today?",
    helpText: "Think of the last real customer — what did they do, what did you do?",
    required: false,
    selectMode: "multi",
    suggestions: [
      "They visit the shop",
      "They call or WhatsApp first",
      "They ask price / stock",
      "They choose and pay later or on spot",
      "I note order in diary / WhatsApp chat",
    ],
    allowCustom: true,
  },
  {
    id: "sellChannel",
    label: "Where do you sell today? (pick all that fit)",
    required: false,
    selectMode: "multi",
    suggestions: [
      "Physical shop / stall only",
      "Home / kitchen business",
      "WhatsApp / phone orders",
      "Instagram or Facebook",
      "I want online for the first time",
    ],
    allowCustom: true,
  },
  {
    id: "shippingHow",
    label: "How do customers get their order?",
    required: false,
    selectMode: "multi",
    suggestions: [
      "Pickup from shop / home",
      "I deliver nearby myself",
      "Courier to other cities",
      "Digital only (no shipping)",
    ],
    allowCustom: true,
  },
  {
    id: "paymentToday",
    label: "How do people pay you today?",
    required: false,
    selectMode: "multi",
    suggestions: [
      "UPI (GPay / PhonePe / Paytm)",
      "Cash on delivery or at shop",
      "Bank transfer",
      "Card machine at shop",
    ],
    allowCustom: true,
  },
];

/** Question ids that only make sense for local shops */
export const ECOM_ONLY_QUESTION_IDS = new Set([
  "offlineDay",
  "customerSteps",
  "busyTimes",
  "whoDoesWhat",
  "offlinePain",
  "appHelpHope",
  "sellChannel",
  "uniqueSelling",
  "shippingHow",
  "paymentToday",
  "shareWhere",
  "whatYouSell",
  "city",
  "deliveryArea",
  "occasions",
  "preferChannel",
  "forStudents",
]);

/**
 * Replace shop-leaked cores and drop ecom-only questions for non-shop verticals.
 */
export function retargetQuestionsForVertical(
  questions: InterviewQuestion[],
  key: InterviewVerticalKey
): InterviewQuestion[] {
  const cores = verticalCoreQuestions(key);
  const coreById = new Map(cores.map((q) => [q.id, q]));
  const isEcom = key === "ecom";

  const out: InterviewQuestion[] = [];
  const seen = new Set<string>();

  for (const q of questions) {
    if (!isEcom && ECOM_ONLY_QUESTION_IDS.has(q.id)) continue;

    // Force correct whoFor / mainJob chips when model or template leaked shop language
    if (
      (q.id === "whoFor" || q.id === "mainJob") &&
      coreById.has(q.id) &&
      (looksLikeShopAudienceChips(q.suggestions) || !q.suggestions?.length)
    ) {
      const core = coreById.get(q.id)!;
      out.push({
        ...core,
        // Keep model label if it is already vertical-specific and longer
        label:
          q.label &&
          !/students,\s*shoppers|everyday customers/i.test(q.helpText || "") &&
          /bank|insur|career|book|tuition|portfolio|client/i.test(q.label)
            ? q.label
            : core.label,
        helpText: core.helpText,
        suggestions: core.suggestions?.length ? core.suggestions : q.suggestions,
        required: false,
      });
      seen.add(q.id);
      continue;
    }

    // whoFor helpText still talking about students/shoppers on a bank → replace
    if (
      q.id === "whoFor" &&
      !isEcom &&
      /students|shoppers|patients|job seekers/i.test(`${q.helpText || ""} ${q.label}`)
    ) {
      const core = coreById.get("whoFor");
      if (core) {
        out.push({ ...core, required: false });
        seen.add(q.id);
        continue;
      }
    }

    out.push({ ...q, required: false });
    seen.add(q.id);
  }

  // Ensure vertical cores exist
  for (const core of cores) {
    if (!seen.has(core.id)) {
      out.push({ ...core, required: false });
      seen.add(core.id);
    }
  }

  return out;
}
