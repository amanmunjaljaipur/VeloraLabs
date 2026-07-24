import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import { DEFAULT_TENANT_ID } from "@/lib/marketing/tenants-store";

/**
 * Persistent memory for the AI Growth Advisor. Every time a strategy is
 * generated (by the "Get strategy" button, or automatically once a day via
 * cron), a snapshot is appended here: what the numbers looked like, what
 * the AI recommended, and what actually got executed. The next strategy
 * call reads the last few entries back into its prompt, so recommendations
 * build on what was already tried rather than repeating the same advice -
 * this is the "learns daily" loop, implemented as a growing log the LLM
 * re-reads rather than any model fine-tuning (there's no training
 * infrastructure here - this is in-context learning from real history,
 * which is the honest way to do this on a free-tier LLM).
 */

const GROWTH_MEMORY_FILE = "marketing-growth-memory.json";
const DEFAULT_JSON = "[]";

export interface GrowthInsight {
  observation: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
}

export interface GrowthAction {
  key: string;
  label: string;
  rationale: string;
}

export interface GrowthExecutionResult {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface GrowthMemoryEntry {
  id: string;
  tenantId: string;
  createdAt: string;
  signalsSummary: string;
  strategySummary: string;
  insights: GrowthInsight[];
  suggestedActions: GrowthAction[];
  executedActions: GrowthExecutionResult[] | null;
  triggeredBy: "manual" | "daily-cron";
}

async function readAll(): Promise<GrowthMemoryEntry[]> {
  await ensureDataFileHydrated(GROWTH_MEMORY_FILE, DEFAULT_JSON, { force: true });
  const all = readJsonFile<GrowthMemoryEntry[]>(GROWTH_MEMORY_FILE, DEFAULT_JSON);
  return all.map((e) => (e.tenantId ? e : { ...e, tenantId: DEFAULT_TENANT_ID }));
}

async function writeAll(items: GrowthMemoryEntry[]): Promise<void> {
  await writeJsonFileAsync(GROWTH_MEMORY_FILE, items, DEFAULT_JSON);
}

export async function listGrowthMemory(tenantId: string, limit = 30): Promise<GrowthMemoryEntry[]> {
  const all = await readAll();
  return all
    .filter((e) => e.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function appendGrowthMemory(input: {
  tenantId: string;
  signalsSummary: string;
  strategySummary: string;
  insights: GrowthInsight[];
  suggestedActions: GrowthAction[];
  triggeredBy: "manual" | "daily-cron";
}): Promise<GrowthMemoryEntry> {
  const all = await readAll();
  const entry: GrowthMemoryEntry = {
    id: randomUUID(),
    tenantId: input.tenantId,
    createdAt: new Date().toISOString(),
    signalsSummary: input.signalsSummary,
    strategySummary: input.strategySummary,
    insights: input.insights,
    suggestedActions: input.suggestedActions,
    executedActions: null,
    triggeredBy: input.triggeredBy,
  };
  all.push(entry);
  await writeAll(all);
  return entry;
}

export async function recordGrowthExecution(
  entryId: string,
  tenantId: string,
  executedActions: GrowthExecutionResult[]
): Promise<GrowthMemoryEntry | null> {
  const all = await readAll();
  const entry = all.find((e) => e.id === entryId && e.tenantId === tenantId);
  if (!entry) return null;
  entry.executedActions = executedActions;
  await writeAll(all);
  return entry;
}
