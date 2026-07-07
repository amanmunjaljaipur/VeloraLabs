import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import type {
  CrmActivity,
  CrmActivityType,
  CrmDataStore,
  CrmFollowUp,
  CrmLead,
  CrmLeadInput,
  CrmStage,
} from "@/lib/crm/types";
import { CRM_STAGES, CRM_STAGE_LABELS } from "@/lib/crm/types";
import { randomUUID } from "crypto";

const CRM_FILE = "crm-data.json";

const EMPTY_STORE: CrmDataStore = {
  version: 1,
  updatedAt: new Date().toISOString(),
  lastSyncedAt: null,
  leads: [],
  activities: [],
  followUps: [],
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readStore(): CrmDataStore {
  return readJsonFile<CrmDataStore>(CRM_FILE, JSON.stringify(EMPTY_STORE));
}

function writeStore(store: CrmDataStore): void {
  store.updatedAt = new Date().toISOString();
  writeJsonFile(CRM_FILE, store, JSON.stringify(EMPTY_STORE));
}

function activeLeads(store: CrmDataStore): CrmLead[] {
  return store.leads.filter((lead) => !lead.deletedAt);
}

function findLeadByEmail(store: CrmDataStore, email: string): CrmLead | undefined {
  const normalized = normalizeEmail(email);
  return activeLeads(store).find((lead) => normalizeEmail(lead.email) === normalized);
}

function findLeadById(store: CrmDataStore, id: string): CrmLead | undefined {
  return activeLeads(store).find((lead) => lead.id === id);
}

function addActivity(
  store: CrmDataStore,
  input: {
    leadId: string;
    type: CrmActivityType;
    body: string;
    meta?: Record<string, string>;
    createdBy?: string;
  }
): CrmActivity {
  const activity: CrmActivity = {
    id: randomUUID(),
    leadId: input.leadId,
    type: input.type,
    body: input.body,
    meta: input.meta ?? {},
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy ?? "system",
  };
  store.activities.unshift(activity);
  return activity;
}

export function upsertLead(
  input: CrmLeadInput,
  options?: { createdBy?: string; activityType?: CrmActivityType; activityBody?: string }
): CrmLead {
  const store = readStore();
  const email = normalizeEmail(input.email);
  if (!email.includes("@")) {
    throw new Error("Valid email is required");
  }

  const now = new Date().toISOString();
  const existing = findLeadByEmail(store, email);

  if (existing) {
    const previousStage = existing.stage;
    if (input.name) existing.name = input.name.trim();
    if (input.phone) existing.phone = input.phone.trim();
    if (input.source) existing.source = input.source;
    if (input.stage) existing.stage = input.stage;
    if (input.audience) existing.audience = input.audience;
    if (input.audienceLabel) existing.audienceLabel = input.audienceLabel;
    if (input.notes !== undefined) existing.notes = input.notes;
    if (input.assignedTo !== undefined) existing.assignedTo = input.assignedTo;
    if (input.tags) existing.tags = input.tags;
    if (input.sessionDate) existing.sessionDate = input.sessionDate;
    if (input.sessionTime) existing.sessionTime = input.sessionTime;
    if (input.sessionTitle) existing.sessionTitle = input.sessionTitle;
    if (input.bookingId) existing.bookingId = input.bookingId;
    if (input.bookingStatus) existing.bookingStatus = input.bookingStatus;
    if (input.isSubscriber !== undefined) existing.isSubscriber = input.isSubscriber;
    if (input.learnerRole) existing.learnerRole = input.learnerRole;
    existing.updatedAt = now;

    if (options?.activityBody) {
      addActivity(store, {
        leadId: existing.id,
        type: options.activityType ?? "sync",
        body: options.activityBody,
        createdBy: options.createdBy,
      });
    }

    if (input.stage && input.stage !== previousStage) {
      addActivity(store, {
        leadId: existing.id,
        type: "stage_change",
        body: `Stage changed to ${CRM_STAGE_LABELS[input.stage]}`,
        meta: { from: previousStage, to: input.stage },
        createdBy: options?.createdBy ?? "system",
      });
    }

    writeStore(store);
    return existing;
  }

  const lead: CrmLead = {
    id: randomUUID(),
    name: input.name?.trim() ?? "",
    email,
    phone: input.phone?.trim() ?? "",
    source: input.source ?? "manual",
    stage: input.stage ?? "new",
    audience: input.audience ?? "",
    audienceLabel: input.audienceLabel ?? "",
    notes: input.notes ?? "",
    assignedTo: input.assignedTo ?? "",
    tags: input.tags ?? [],
    sessionDate: input.sessionDate ?? "",
    sessionTime: input.sessionTime ?? "",
    sessionTitle: input.sessionTitle ?? "",
    bookingId: input.bookingId ?? "",
    bookingStatus: input.bookingStatus ?? "",
    isSubscriber: input.isSubscriber ?? false,
    learnerRole: input.learnerRole ?? "",
    externalRefs: {},
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  store.leads.unshift(lead);
  addActivity(store, {
    leadId: lead.id,
    type: options?.activityType ?? "note",
    body: options?.activityBody ?? "Lead created",
    createdBy: options?.createdBy ?? "system",
  });
  writeStore(store);
  return lead;
}

export function createLead(input: CrmLeadInput, createdBy: string): CrmLead {
  return upsertLead(input, {
    createdBy,
    activityType: "note",
    activityBody: "Lead added manually",
  });
}

export function updateLead(
  id: string,
  patch: Partial<CrmLeadInput> & { stage?: CrmStage; notes?: string; assignedTo?: string },
  updatedBy: string
): CrmLead | null {
  const store = readStore();
  const lead = findLeadById(store, id);
  if (!lead) return null;

  const previousStage = lead.stage;
  if (patch.name !== undefined) lead.name = patch.name.trim();
  if (patch.email !== undefined) lead.email = normalizeEmail(patch.email);
  if (patch.phone !== undefined) lead.phone = patch.phone.trim();
  if (patch.source !== undefined) lead.source = patch.source;
  if (patch.stage !== undefined) lead.stage = patch.stage;
  if (patch.audience !== undefined) lead.audience = patch.audience;
  if (patch.audienceLabel !== undefined) lead.audienceLabel = patch.audienceLabel;
  if (patch.notes !== undefined) lead.notes = patch.notes;
  if (patch.assignedTo !== undefined) lead.assignedTo = patch.assignedTo;
  if (patch.tags !== undefined) lead.tags = patch.tags;
  if (patch.sessionDate !== undefined) lead.sessionDate = patch.sessionDate;
  if (patch.sessionTime !== undefined) lead.sessionTime = patch.sessionTime;
  if (patch.sessionTitle !== undefined) lead.sessionTitle = patch.sessionTitle;
  if (patch.bookingId !== undefined) lead.bookingId = patch.bookingId;
  if (patch.bookingStatus !== undefined) lead.bookingStatus = patch.bookingStatus;
  lead.updatedAt = new Date().toISOString();

  if (patch.stage && patch.stage !== previousStage) {
    addActivity(store, {
      leadId: lead.id,
      type: "stage_change",
      body: `Stage changed to ${CRM_STAGE_LABELS[patch.stage]}`,
      meta: { from: previousStage, to: patch.stage },
      createdBy: updatedBy,
    });
  }

  writeStore(store);
  return lead;
}

export function deleteLead(id: string, deletedBy: string): boolean {
  const store = readStore();
  const lead = findLeadById(store, id);
  if (!lead) return false;

  lead.deletedAt = new Date().toISOString();
  lead.updatedAt = lead.deletedAt;
  addActivity(store, {
    leadId: lead.id,
    type: "note",
    body: "Lead archived",
    createdBy: deletedBy,
  });
  writeStore(store);
  return true;
}

export function addLeadActivity(
  leadId: string,
  input: { type: CrmActivityType; body: string; createdBy: string; meta?: Record<string, string> }
): CrmActivity | null {
  const store = readStore();
  const lead = findLeadById(store, leadId);
  if (!lead) return null;

  const activity = addActivity(store, {
    leadId,
    type: input.type,
    body: input.body,
    meta: input.meta,
    createdBy: input.createdBy,
  });
  lead.updatedAt = new Date().toISOString();
  writeStore(store);
  return activity;
}

export function addFollowUp(
  leadId: string,
  input: { dueAt: string; reason: string; createdBy: string }
): CrmFollowUp | null {
  const store = readStore();
  const lead = findLeadById(store, leadId);
  if (!lead) return null;

  const followUp: CrmFollowUp = {
    id: randomUUID(),
    leadId,
    dueAt: input.dueAt,
    reason: input.reason,
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  };
  store.followUps.unshift(followUp);
  addActivity(store, {
    leadId,
    type: "note",
    body: `Follow-up scheduled: ${input.reason}`,
    createdBy: input.createdBy,
  });
  lead.updatedAt = new Date().toISOString();
  writeStore(store);
  return followUp;
}

export function updateFollowUpStatus(
  followUpId: string,
  status: CrmFollowUp["status"],
  updatedBy: string
): CrmFollowUp | null {
  const store = readStore();
  const followUp = store.followUps.find((item) => item.id === followUpId);
  if (!followUp) return null;

  followUp.status = status;
  addActivity(store, {
    leadId: followUp.leadId,
    type: "note",
    body: `Follow-up marked ${status}`,
    createdBy: updatedBy,
  });
  writeStore(store);
  return followUp;
}

export function getLeadDetail(id: string): {
  lead: CrmLead;
  activities: CrmActivity[];
  followUps: CrmFollowUp[];
} | null {
  const store = readStore();
  const lead = findLeadById(store, id);
  if (!lead) return null;

  return {
    lead,
    activities: store.activities.filter((item) => item.leadId === id),
    followUps: store.followUps.filter((item) => item.leadId === id),
  };
}

export function readCrmStore(): CrmDataStore {
  return readStore();
}

export function setLastSyncedAt(iso: string): void {
  const store = readStore();
  store.lastSyncedAt = iso;
  writeStore(store);
}

export function buildCrmStats(store: CrmDataStore) {
  const leads = activeLeads(store);
  const byStage = Object.fromEntries(CRM_STAGES.map((stage) => [stage, 0])) as Record<
    CrmStage,
    number
  >;
  const bySource: Record<string, number> = {};

  for (const lead of leads) {
    byStage[lead.stage] += 1;
    bySource[lead.source] = (bySource[lead.source] ?? 0) + 1;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const pendingFollowUps = store.followUps.filter((item) => item.status === "pending");
  const dueToday = pendingFollowUps.filter((item) => {
    const due = new Date(item.dueAt).getTime();
    return due >= todayStart && due < todayStart + 86_400_000;
  }).length;

  return {
    total: leads.length,
    byStage,
    bySource,
    pendingFollowUps: pendingFollowUps.length,
    dueToday,
  };
}