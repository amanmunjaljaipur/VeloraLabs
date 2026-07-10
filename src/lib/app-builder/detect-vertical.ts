/**
 * Infer App Builder extension + app kind from the user's free-text idea.
 * Prompt understanding first — never force ecom for every product.
 */

import type { AppExtensionId } from "@/lib/app-builder/types";

export type DetectedVertical = {
  extensionId: AppExtensionId;
  /** Short machine kind for UI/content */
  appKind: string;
  /** Human label */
  label: string;
  confidence: "high" | "medium" | "low";
  reasons: string[];
};

const RULES: Array<{
  match: RegExp;
  extensionId: AppExtensionId;
  appKind: string;
  label: string;
}> = [
  {
    match: /\b(resume|cv|curriculum|career|linkedin profile|job application)\b/i,
    extensionId: "resume-career",
    appKind: "resume-career",
    label: "Resume / career tool",
  },
  {
    match: /\b(insurance|policy|premium|claim|insurer|health cover|term life)\b/i,
    extensionId: "insurance",
    appKind: "insurance",
    label: "Insurance app",
  },
  {
    match: /\b(bank|banking|neobank|fintech|wallet|upi app|savings account|loan app|digital bank)\b/i,
    extensionId: "digital-banking",
    appKind: "digital-banking",
    label: "Digital banking / fintech",
  },
  {
    match: /\b(book(ing)?|appointment|salon|clinic|slot|reservation|doctor|spa)\b/i,
    extensionId: "booking-local",
    appKind: "booking",
    label: "Booking / appointments",
  },
  {
    match: /\b(tuition|coaching|batch|class(es)?|students|teacher|exam)\b/i,
    extensionId: "tuition-centre",
    appKind: "tuition",
    label: "Tuition / coaching",
  },
  {
    match: /\b(portfolio|designer|photographer|freelancer showcase|case stud(y|ies))\b/i,
    extensionId: "portfolio",
    appKind: "portfolio",
    label: "Portfolio / personal brand",
  },
  {
    match: /\b(shop|store|kirana|catalogue|catalog|products?|ecommerce|e-commerce|sell|whatsapp order|grocery|bakery|craft)\b/i,
    extensionId: "ecom-local-shop",
    appKind: "ecom",
    label: "Local shop / catalogue",
  },
];

/**
 * Detect vertical from prompt. Unknown ideas → generic-app (still fully buildable).
 */
export function detectVerticalFromPrompt(prompt: string): DetectedVertical {
  const text = prompt.trim();
  if (!text) {
    return {
      extensionId: "generic-app",
      appKind: "custom",
      label: "Custom app",
      confidence: "low",
      reasons: ["Empty prompt"],
    };
  }

  for (const rule of RULES) {
    if (rule.match.test(text)) {
      return {
        extensionId: rule.extensionId,
        appKind: rule.appKind,
        label: rule.label,
        confidence: "high",
        reasons: [`Matched pattern for ${rule.label}`],
      };
    }
  }

  return {
    extensionId: "generic-app",
    appKind: "custom",
    label: "Custom product from your idea",
    confidence: "medium",
    reasons: ["No fixed vertical matched — building a flexible app shaped by your prompt"],
  };
}

/** True when this extension uses the generic multi-page runtime (not ecom catalogue). */
export function usesGenericRuntime(extensionId: string): boolean {
  return extensionId !== "ecom-local-shop";
}
