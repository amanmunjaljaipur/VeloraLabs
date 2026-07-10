import type { StudioAppSpec, StudioProductKind } from "@/lib/app-studio/types";

/** Infer specialized product UI from spec (works for old Blob projects too). */
export function detectProductKind(spec: StudioAppSpec): StudioProductKind {
  if (spec.productKind && spec.productKind !== "generic") return spec.productKind;

  const blob = [
    spec.brandName,
    spec.tagline,
    spec.description,
    spec.rewrittenPrompt,
    ...spec.entities.map((e) => `${e.id} ${e.name}`),
    ...spec.screens.map((s) => s.title),
  ]
    .join(" ")
    .toLowerCase();

  if (/\bresume|cv\b|linkedin|career|job.?seek|cover.?letter|resumelift\b/.test(blob)) {
    return "resume";
  }
  if (
    /\bbank|neobank|fintech|wallet|upi|transfer|savings account|debit card|digital.?bank\b/.test(
      blob
    )
  ) {
    return "banking";
  }
  if (
    /\bmarketplace|e-?commerce|amazon|flipkart|cart|checkout|seller.?central|product catalog|online.?shop\b/.test(
      blob
    )
  ) {
    return "ecommerce";
  }
  if (/\byoga|booking|class schedule|appointment|salon\b/.test(blob)) return "booking";
  if (/\bexpense|claim|reimburse\b/.test(blob)) return "expense";
  if (/\bcrm|pipeline|lead|deal\b/.test(blob)) return "crm";
  if (/\btask|kanban|todo\b/.test(blob)) return "tasks";
  return "generic";
}
