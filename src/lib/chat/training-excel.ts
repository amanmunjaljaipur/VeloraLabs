import * as XLSX from "xlsx";
import type { TrainingEntry, TrainingEntryInput } from "./training-types";
import { EXCEL_COLUMNS } from "./training-types";

function splitPipe(value: unknown): string[] {
  if (!value) return [];
  return String(value)
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseEnabled(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  const s = String(value).trim().toLowerCase();
  return s === "yes" || s === "true" || s === "1" || s === "y";
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

const HEADER_MAP: Record<string, keyof TrainingEntryInput | "linkLabel" | "linkUrl"> = {
  category: "category",
  question: "question",
  answer: "answer",
  "alternate questions": "alternateQuestions",
  alternates: "alternateQuestions",
  keywords: "keywords",
  bullets: "bullets",
  "link label": "linkLabel",
  "link url": "linkUrl",
  enabled: "enabled",
};

export function parseTrainingExcel(buffer: ArrayBuffer): TrainingEntryInput[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const results: TrainingEntryInput[] = [];

  for (const row of rows) {
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const field = HEADER_MAP[normalizeHeader(key)];
      if (field) mapped[field] = value;
    }

    const question = String(mapped.question ?? "").trim();
    const answer = String(mapped.answer ?? "").trim();
    if (!question || !answer) continue;

    const linkLabel = String(mapped.linkLabel ?? "").trim();
    const linkUrl = String(mapped.linkUrl ?? "").trim();

    results.push({
      category: String(mapped.category ?? "General").trim() || "General",
      question,
      answer,
      alternateQuestions: splitPipe(mapped.alternateQuestions),
      keywords: splitPipe(mapped.keywords),
      bullets: splitPipe(mapped.bullets),
      links:
        linkLabel && linkUrl ? [{ label: linkLabel, href: linkUrl }] : [],
      enabled: parseEnabled(mapped.enabled),
    });
  }

  return results;
}

export function buildTrainingExcel(entries: TrainingEntry[]): ArrayBuffer {
  const rows = entries.map((e) => ({
    [EXCEL_COLUMNS[0]]: e.category,
    [EXCEL_COLUMNS[1]]: e.question,
    [EXCEL_COLUMNS[2]]: e.answer,
    [EXCEL_COLUMNS[3]]: e.alternateQuestions.join(" | "),
    [EXCEL_COLUMNS[4]]: e.keywords.join(" | "),
    [EXCEL_COLUMNS[5]]: e.bullets.join(" | "),
    [EXCEL_COLUMNS[6]]: e.links[0]?.label ?? "",
    [EXCEL_COLUMNS[7]]: e.links[0]?.href ?? "",
    [EXCEL_COLUMNS[8]]: e.enabled ? "Yes" : "No",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 14 },
    { wch: 42 },
    { wch: 60 },
    { wch: 36 },
    { wch: 28 },
    { wch: 36 },
    { wch: 18 },
    { wch: 24 },
    { wch: 8 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Chatbot Training");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function buildTemplateExcel(): ArrayBuffer {
  const example: TrainingEntryInput = {
    category: "Pricing",
    question: "What are the course prices?",
    answer:
      "School Students: ₹3,000 intro (list ₹9,999). Engineers: ₹4,500 (list ₹14,999). PMs: ₹7,500 (list ₹24,999). Free session is always free.",
    alternateQuestions: ["course price", "how much", "pricing model"],
    keywords: ["price", "cost", "rupees", "discount"],
    bullets: [],
    links: [{ label: "View courses", href: "/courses" }],
    enabled: true,
  };

  return buildTrainingExcel([
    {
      id: "example",
      category: example.category,
      question: example.question,
      answer: example.answer,
      bullets: [],
      keywords: example.keywords ?? [],
      alternateQuestions: example.alternateQuestions ?? [],
      links: example.links ?? [],
      enabled: true,
      source: "manual",
      updatedAt: new Date().toISOString(),
    },
  ]);
}