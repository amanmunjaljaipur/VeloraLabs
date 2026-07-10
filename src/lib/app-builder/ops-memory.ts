/**
 * App Builder operational memory store.
 *
 * CRITICAL: This is NOT product code memory.
 * - Stored as runtime Blob data (`app-builder-ops-memory.json`)
 * - Listed in RUNTIME_DATA_FILES → never git-seeded on Vercel
 * - Awaited Blob writes → survives deploys and product refactors
 * - Agents must read/write here for research + experience, not invent each time
 */

import {
  DEFAULT_AGENT_REGISTRY,
  OPS_MEMORY_FILE,
  type AppBuilderAgentId,
  type AppBuilderOpsMemory,
  type ExperienceEntry,
  type ExperienceKind,
  type VerticalResearchPack,
} from "@/lib/app-builder/ops-memory-types";
import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";
import { randomBytes } from "crypto";

const EMPTY: AppBuilderOpsMemory = {
  version: 1,
  updatedAt: new Date().toISOString(),
  memoryClass: "operational",
  verticals: {},
  experiences: [],
  production: {
    standingNotes: [],
    knownGaps: [],
    agentPreferences: [],
  },
  agents: DEFAULT_AGENT_REGISTRY,
};

const EMPTY_JSON = JSON.stringify(EMPTY);

let cache: AppBuilderOpsMemory | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 5_000;
let loadPromise: Promise<void> | null = null;

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

function normalizeVerticalId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function readLocal(): AppBuilderOpsMemory {
  const data = readJsonFile<AppBuilderOpsMemory>(OPS_MEMORY_FILE, EMPTY_JSON);
  return {
    version: data.version ?? 1,
    updatedAt: data.updatedAt ?? EMPTY.updatedAt,
    memoryClass: "operational",
    verticals: data.verticals && typeof data.verticals === "object" ? data.verticals : {},
    experiences: Array.isArray(data.experiences) ? data.experiences : [],
    production: {
      standingNotes: Array.isArray(data.production?.standingNotes)
        ? data.production.standingNotes
        : [],
      knownGaps: Array.isArray(data.production?.knownGaps) ? data.production.knownGaps : [],
      agentPreferences: Array.isArray(data.production?.agentPreferences)
        ? data.production.agentPreferences
        : [],
    },
    agents:
      Array.isArray(data.agents) && data.agents.length > 0
        ? data.agents
        : DEFAULT_AGENT_REGISTRY,
  };
}

export async function ensureOpsMemoryLoaded(force = false): Promise<AppBuilderOpsMemory> {
  if (!force && cache && Date.now() - cacheAt < CACHE_TTL_MS) {
    return cache;
  }
  if (loadPromise) {
    await loadPromise;
    return cache ?? readLocal();
  }

  loadPromise = (async () => {
    await ensureDataFileHydrated(OPS_MEMORY_FILE, EMPTY_JSON, { force: true });
    cache = readLocal();
    cacheAt = Date.now();
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
  return cache ?? readLocal();
}

async function writeOpsMemory(store: AppBuilderOpsMemory): Promise<AppBuilderOpsMemory> {
  const next: AppBuilderOpsMemory = {
    ...store,
    memoryClass: "operational",
    updatedAt: new Date().toISOString(),
    agents: store.agents?.length ? store.agents : DEFAULT_AGENT_REGISTRY,
  };
  await writeJsonFileAsync(OPS_MEMORY_FILE, next, EMPTY_JSON);
  cache = next;
  cacheAt = Date.now();
  return next;
}

export async function getOpsMemory(): Promise<AppBuilderOpsMemory> {
  return ensureOpsMemoryLoaded(true);
}

export async function getVerticalResearch(
  verticalId: string
): Promise<VerticalResearchPack | null> {
  const store = await ensureOpsMemoryLoaded(true);
  const id = normalizeVerticalId(verticalId);
  return store.verticals[id] || null;
}

export async function listVerticals(): Promise<VerticalResearchPack[]> {
  const store = await ensureOpsMemoryLoaded(true);
  return Object.values(store.verticals).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

/** True if we have non-empty research for this vertical */
export async function hasVerticalResearch(verticalId: string): Promise<boolean> {
  const pack = await getVerticalResearch(verticalId);
  if (!pack) return false;
  return (
    pack.publicPages.length > 0 ||
    pack.interviewThemes.length > 0 ||
    pack.leaders.length > 0 ||
    Boolean(pack.rawNotes?.trim())
  );
}

export async function upsertVerticalResearch(
  pack: Omit<VerticalResearchPack, "useCount" | "researchedAt" | "updatedAt"> & {
    researchedAt?: string;
    useCount?: number;
  }
): Promise<VerticalResearchPack> {
  const store = await ensureOpsMemoryLoaded(true);
  const id = normalizeVerticalId(pack.id);
  const prev = store.verticals[id];
  const now = new Date().toISOString();
  const nextPack: VerticalResearchPack = {
    ...pack,
    id,
    researchedAt: prev?.researchedAt || pack.researchedAt || now,
    updatedAt: now,
    useCount: pack.useCount ?? prev?.useCount ?? 0,
  };
  store.verticals[id] = nextPack;
  await writeOpsMemory(store);
  return nextPack;
}

export async function touchVerticalUse(verticalId: string): Promise<void> {
  const store = await ensureOpsMemoryLoaded(true);
  const id = normalizeVerticalId(verticalId);
  const pack = store.verticals[id];
  if (!pack) return;
  pack.useCount = (pack.useCount || 0) + 1;
  pack.updatedAt = new Date().toISOString();
  store.verticals[id] = pack;
  await writeOpsMemory(store);
}

export async function logExperience(input: {
  agent: AppBuilderAgentId | string;
  kind: ExperienceKind;
  summary: string;
  detail?: string;
  verticalId?: string;
  tags?: string[];
  productionSafe?: boolean;
}): Promise<ExperienceEntry> {
  const store = await ensureOpsMemoryLoaded(true);
  const entry: ExperienceEntry = {
    id: newId("exp"),
    at: new Date().toISOString(),
    agent: input.agent,
    kind: input.kind,
    verticalId: input.verticalId ? normalizeVerticalId(input.verticalId) : undefined,
    summary: input.summary.slice(0, 280),
    detail: (input.detail || "").slice(0, 4000),
    tags: (input.tags || []).slice(0, 12),
    productionSafe: input.productionSafe !== false,
  };
  // Cap experiences to last 500; never drop productionSafe standing notes (those live in production)
  const next = [entry, ...store.experiences].slice(0, 500);
  store.experiences = next;
  await writeOpsMemory(store);
  return entry;
}

export async function addProductionStandingNote(note: string, tags: string[] = []) {
  const store = await ensureOpsMemoryLoaded(true);
  store.production.standingNotes.unshift({
    id: newId("note"),
    at: new Date().toISOString(),
    note: note.slice(0, 1000),
    tags: tags.slice(0, 8),
  });
  store.production.standingNotes = store.production.standingNotes.slice(0, 200);
  await writeOpsMemory(store);
}

export async function addKnownGap(input: {
  gap: string;
  severity?: "low" | "medium" | "high";
}) {
  const store = await ensureOpsMemoryLoaded(true);
  store.production.knownGaps.unshift({
    id: newId("gap"),
    at: new Date().toISOString(),
    gap: input.gap.slice(0, 500),
    severity: input.severity || "medium",
    status: "open",
  });
  store.production.knownGaps = store.production.knownGaps.slice(0, 100);
  await writeOpsMemory(store);
}

export async function setAgentPreference(key: string, value: string) {
  const store = await ensureOpsMemoryLoaded(true);
  const existing = store.production.agentPreferences.find((p) => p.key === key);
  if (existing) {
    existing.value = value.slice(0, 500);
    existing.at = new Date().toISOString();
  } else {
    store.production.agentPreferences.push({
      id: newId("pref"),
      key: key.slice(0, 80),
      value: value.slice(0, 500),
      at: new Date().toISOString(),
    });
  }
  await writeOpsMemory(store);
}

/** Context snapshot for any agent before starting work */
export async function getAgentContext(opts?: {
  verticalId?: string;
  experienceLimit?: number;
}): Promise<{
  memoryClass: "operational";
  survivesDeploy: true;
  agents: AppBuilderOpsMemory["agents"];
  vertical: VerticalResearchPack | null;
  recentExperiences: ExperienceEntry[];
  production: AppBuilderOpsMemory["production"];
  needsResearch: boolean;
}> {
  const store = await ensureOpsMemoryLoaded(true);
  const verticalId = opts?.verticalId ? normalizeVerticalId(opts.verticalId) : "";
  const vertical = verticalId ? store.verticals[verticalId] || null : null;
  const limit = opts?.experienceLimit ?? 20;
  const recent = store.experiences
    .filter((e) => !verticalId || e.verticalId === verticalId || e.productionSafe)
    .slice(0, limit);

  return {
    memoryClass: "operational",
    survivesDeploy: true,
    agents: store.agents,
    vertical,
    recentExperiences: recent,
    production: store.production,
    needsResearch: Boolean(verticalId) && !vertical,
  };
}

export { normalizeVerticalId };
