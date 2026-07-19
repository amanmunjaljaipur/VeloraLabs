/**
 * Super Admin agent pause controls - deploy-safe Blob runtime store.
 * Pausing a runtime agent blocks its API routes until resumed.
 */

import {
  getAgentDef,
  listAgentIds,
  PLATFORM_AGENTS,
  type PlatformAgentDef,
  type PlatformAgentId,
} from "@/lib/agents/registry";
import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";

const FILE = "agent-controls.json";

export type AgentControlState = {
  paused: boolean;
  pausedAt?: string;
  pausedBy?: string;
  note?: string;
};

export type AgentControlsStore = {
  version: number;
  updatedAt: string;
  /** agentId → state (missing = active) */
  agents: Record<string, AgentControlState>;
};

const EMPTY: AgentControlsStore = {
  version: 1,
  updatedAt: new Date().toISOString(),
  agents: {},
};

const EMPTY_JSON = JSON.stringify(EMPTY);

let cache: AgentControlsStore | null = null;
let cacheAt = 0;
const TTL = 10_000;

function readLocal(): AgentControlsStore {
  const data = readJsonFile<AgentControlsStore>(FILE, EMPTY_JSON);
  return {
    version: data.version ?? 1,
    updatedAt: data.updatedAt ?? EMPTY.updatedAt,
    agents: data.agents && typeof data.agents === "object" ? data.agents : {},
  };
}

export async function ensureAgentControlsLoaded(force = false): Promise<AgentControlsStore> {
  if (!force && cache && Date.now() - cacheAt < TTL) return cache;
  await ensureDataFileHydrated(FILE, EMPTY_JSON, { force: true });
  cache = readLocal();
  cacheAt = Date.now();
  return cache;
}

async function writeStore(store: AgentControlsStore): Promise<AgentControlsStore> {
  const next = { ...store, updatedAt: new Date().toISOString() };
  await writeJsonFileAsync(FILE, next, EMPTY_JSON);
  cache = next;
  cacheAt = Date.now();
  return next;
}

export async function isAgentPaused(agentId: PlatformAgentId | string): Promise<boolean> {
  const store = await ensureAgentControlsLoaded();
  return store.agents[agentId]?.paused === true;
}

/**
 * Call at the start of runtime agent APIs.
 * Returns a JSON-ready error payload if paused, else null.
 */
export async function assertAgentActive(
  agentId: PlatformAgentId
): Promise<{ error: string; agentId: string; paused: true } | null> {
  const def = getAgentDef(agentId);
  if (!def?.pausableRuntime) return null;
  const paused = await isAgentPaused(agentId);
  if (!paused) return null;
  return {
    error: `${def.name} is paused by Super Admin. Resume it under Admin → Agents.`,
    agentId,
    paused: true,
  };
}

export type AgentRow = PlatformAgentDef & {
  paused: boolean;
  pausedAt?: string;
  pausedBy?: string;
  note?: string;
  status: "active" | "paused";
};

export async function listAgentsWithStatus(): Promise<AgentRow[]> {
  const store = await ensureAgentControlsLoaded(true);
  return PLATFORM_AGENTS.map((def) => {
    const st = store.agents[def.id];
    const paused = st?.paused === true;
    return {
      ...def,
      paused,
      pausedAt: st?.pausedAt,
      pausedBy: st?.pausedBy,
      note: st?.note,
      status: paused ? ("paused" as const) : ("active" as const),
    };
  });
}

export async function setAgentPaused(input: {
  agentId: string;
  paused: boolean;
  byEmail: string;
  note?: string;
}): Promise<AgentRow | null> {
  const def = getAgentDef(input.agentId);
  if (!def) return null;

  const store = await ensureAgentControlsLoaded(true);
  if (input.paused) {
    store.agents[def.id] = {
      paused: true,
      pausedAt: new Date().toISOString(),
      pausedBy: input.byEmail,
      note: input.note?.slice(0, 280),
    };
  } else {
    store.agents[def.id] = {
      paused: false,
      pausedAt: undefined,
      pausedBy: input.byEmail,
      note: input.note?.slice(0, 280),
    };
  }
  await writeStore(store);

  const st = store.agents[def.id];
  return {
    ...def,
    paused: st.paused === true,
    pausedAt: st.pausedAt,
    pausedBy: st.pausedBy,
    note: st.note,
    status: st.paused ? "paused" : "active",
  };
}

export async function pauseAllRuntimeAgents(byEmail: string): Promise<number> {
  const store = await ensureAgentControlsLoaded(true);
  let n = 0;
  for (const id of listAgentIds()) {
    const def = getAgentDef(id);
    if (!def?.pausableRuntime) continue;
    store.agents[id] = {
      paused: true,
      pausedAt: new Date().toISOString(),
      pausedBy: byEmail,
      note: "Paused all runtime agents",
    };
    n += 1;
  }
  await writeStore(store);
  return n;
}

export async function resumeAllAgents(byEmail: string): Promise<number> {
  const store = await ensureAgentControlsLoaded(true);
  let n = 0;
  for (const id of Object.keys(store.agents)) {
    if (store.agents[id]?.paused) {
      store.agents[id] = {
        paused: false,
        pausedBy: byEmail,
        note: "Resumed all",
      };
      n += 1;
    }
  }
  await writeStore(store);
  return n;
}
