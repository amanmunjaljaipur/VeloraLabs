/**
 * Shopify-style launch checklist derived from interview answers.
 * Shown after publish so owners know what to do next (share, WhatsApp, photos).
 */

import type { AppInterviewAnswer } from "@/lib/app-builder/types";

export type LaunchChecklistItem = {
  id: string;
  title: string;
  detail: string;
  doneHint?: string;
};

function answerMap(answers: AppInterviewAnswer[]): Record<string, string> {
  return Object.fromEntries(answers.map((a) => [a.id, a.answer.trim()]));
}

export function buildLaunchChecklist(input: {
  brandName: string;
  publicPath: string;
  answers: AppInterviewAnswer[];
  hasProducts: boolean;
  hasLogo: boolean;
}): LaunchChecklistItem[] {
  const a = answerMap(input.answers);
  const share = (a.shareWhere || "").toLowerCase();
  const payment = (a.paymentToday || "").toLowerCase();
  const shipping = (a.shippingHow || "").toLowerCase();

  const items: LaunchChecklistItem[] = [
    {
      id: "open",
      title: "Open your live shop link",
      detail: `Check ${input.publicPath} on your phone — this is what customers will see.`,
      doneHint: "Open shop",
    },
    {
      id: "tour",
      title: "Take the guided tour once",
      detail: "Use “Take a tour” in the top bar (shop or admin) — overlay arrows point at each feature.",
    },
    {
      id: "products",
      title: input.hasProducts
        ? "Review product names, prices, and photos"
        : "Add your first products with photos",
      detail:
        "Dashboard → Products: upload your own photo, paste a link, or Find photos (web + AI).",
    },
    {
      id: "logo",
      title: input.hasLogo ? "Confirm your logo looks good" : "Upload logo & build theme colours",
      detail:
        "Dashboard → Brand & theme — upload logo, multi-colour theme from image. Overview → Improve shop wording for SEO-ready copy.",
    },
    {
      id: "whatsapp",
      title: "Test WhatsApp / call buttons",
      detail: "From Contact and product order — make sure your number opens correctly.",
    },
    {
      id: "share",
      title: share.includes("whatsapp")
        ? "Share link on WhatsApp status or groups"
        : share.includes("instagram")
          ? "Put the shop link in Instagram bio"
          : "Share your shop link with 5 customers",
      detail: "Industry leaders grow by sharing the catalog link first — friends, status, board at shop.",
    },
    {
      id: "payment",
      title: payment.includes("upi")
        ? "Write your UPI ID in FAQ or WhatsApp reply template"
        : "Confirm how you take payment (UPI / cash)",
      detail: "Customers should know how to pay before they order (Instamojo-style clarity).",
    },
    {
      id: "delivery",
      title: shipping.includes("pickup")
        ? "Write clear pickup instructions"
        : "Confirm delivery area on the Help page",
      detail: "Dashboard → Site CMS → FAQ / Contact — reduce “do you deliver?” chats.",
    },
    {
      id: "crm",
      title: "Open CRM after first enquiries",
      detail: "Sign-ups, orders, and messages land in Dashboard → CRM automatically.",
    },
    {
      id: "google",
      title: "Optional: add link on Google Business later",
      detail: "When ready, paste your shop URL as the website on Google Business Profile.",
    },
  ];

  return items;
}
