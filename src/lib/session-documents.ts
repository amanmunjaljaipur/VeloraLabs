import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import {
  buildGoogleDriveLearnerUrl,
  inferDocumentType,
  isGoogleDriveUrl,
} from "@/lib/google-drive";
import { randomUUID } from "crypto";

export type SessionDocumentType = "pdf" | "doc" | "slides" | "link";

export interface SessionDocumentRecord {
  id: string;
  title: string;
  adminUrl: string;
  learnerUrl: string;
  type: SessionDocumentType;
  summary: string;
  visibleToLearners: boolean;
  updatedAt: string;
  updatedBy: string;
}

type SessionDocumentsConfig = Record<string, SessionDocumentRecord[]>;

const DOCUMENTS_FILE = "session-documents.json";

interface LegacySessionDocumentRecord {
  title: string;
  url: string;
  type: SessionDocumentType;
  updatedAt: string;
  updatedBy: string;
}

function migrateLegacyRecord(
  sessionId: string,
  legacy: LegacySessionDocumentRecord
): SessionDocumentRecord {
  const learnerUrl = isGoogleDriveUrl(legacy.url)
    ? buildGoogleDriveLearnerUrl(legacy.url)
    : legacy.url;

  return {
    id: randomUUID(),
    title: legacy.title,
    adminUrl: legacy.url,
    learnerUrl,
    type: legacy.type,
    summary: "",
    visibleToLearners: true,
    updatedAt: legacy.updatedAt,
    updatedBy: legacy.updatedBy,
  };
}

function normalizeDocumentsConfig(raw: unknown): SessionDocumentsConfig {
  if (!raw || typeof raw !== "object") return {};

  const config: SessionDocumentsConfig = {};
  for (const [sessionId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      config[sessionId] = value
        .filter((item): item is SessionDocumentRecord => {
          return Boolean(item && typeof item === "object" && "adminUrl" in item && "id" in item);
        })
        .map((item) => ({
          ...item,
          visibleToLearners: item.visibleToLearners !== false,
          summary: item.summary ?? "",
        }));
      continue;
    }

    if (value && typeof value === "object" && "url" in value) {
      config[sessionId] = [migrateLegacyRecord(sessionId, value as LegacySessionDocumentRecord)];
    }
  }

  return config;
}

function readDocumentsFile(): SessionDocumentsConfig {
  const raw = readJsonFile<unknown>(DOCUMENTS_FILE, "{}");
  return normalizeDocumentsConfig(raw);
}

function writeDocumentsFile(documents: SessionDocumentsConfig): void {
  writeJsonFile(DOCUMENTS_FILE, documents, "{}");
}

export function getSessionDocuments(
  sessionId: string,
  options?: { learnersOnly?: boolean }
): SessionDocumentRecord[] {
  const documents = readDocumentsFile();
  const records = documents[sessionId] ?? [];
  if (!options?.learnersOnly) return records;
  return records.filter((record) => record.visibleToLearners);
}

/** @deprecated Use getSessionDocuments instead */
export function getSessionDocument(sessionId: string): SessionDocumentRecord | null {
  const records = getSessionDocuments(sessionId);
  return records[0] ?? null;
}

export function getAllSessionDocuments(): SessionDocumentsConfig {
  return readDocumentsFile();
}

export function countSessionDocuments(sessionId: string): number {
  return getSessionDocuments(sessionId).length;
}

export function addSessionDocument(
  sessionId: string,
  input: {
    title: string;
    adminUrl: string;
    learnerUrl?: string;
    type?: SessionDocumentType;
    summary?: string;
    visibleToLearners?: boolean;
  },
  updatedBy: string
): SessionDocumentRecord {
  const documents = readDocumentsFile();
  const adminUrl = input.adminUrl.trim();
  const learnerUrl = (input.learnerUrl?.trim() || buildGoogleDriveLearnerUrl(adminUrl)).trim();
  const type = input.type ?? (isGoogleDriveUrl(adminUrl) ? inferDocumentType(adminUrl) : "link");

  const record: SessionDocumentRecord = {
    id: randomUUID(),
    title: input.title.trim(),
    adminUrl,
    learnerUrl,
    type,
    summary: input.summary?.trim() ?? "",
    visibleToLearners: input.visibleToLearners !== false,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  const existing = documents[sessionId] ?? [];
  documents[sessionId] = [record, ...existing];
  writeDocumentsFile(documents);
  return record;
}

export function updateSessionDocument(
  sessionId: string,
  documentId: string,
  patch: Partial<
    Pick<
      SessionDocumentRecord,
      "title" | "adminUrl" | "learnerUrl" | "type" | "summary" | "visibleToLearners"
    >
  >,
  updatedBy: string
): SessionDocumentRecord | null {
  const documents = readDocumentsFile();
  const records = documents[sessionId];
  if (!records) return null;

  const index = records.findIndex((record) => record.id === documentId);
  if (index === -1) return null;

  const current = records[index];
  const adminUrl = patch.adminUrl?.trim() ?? current.adminUrl;
  const next: SessionDocumentRecord = {
    ...current,
    title: patch.title?.trim() ?? current.title,
    adminUrl,
    learnerUrl:
      patch.learnerUrl?.trim() ??
      (patch.adminUrl ? buildGoogleDriveLearnerUrl(adminUrl) : current.learnerUrl),
    type: patch.type ?? current.type,
    summary: patch.summary !== undefined ? patch.summary.trim() : current.summary,
    visibleToLearners: patch.visibleToLearners ?? current.visibleToLearners,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  records[index] = next;
  documents[sessionId] = records;
  writeDocumentsFile(documents);
  return next;
}

export function removeSessionDocument(sessionId: string, documentId: string): boolean {
  const documents = readDocumentsFile();
  const records = documents[sessionId];
  if (!records) return false;

  const next = records.filter((record) => record.id !== documentId);
  if (next.length === records.length) return false;

  if (next.length === 0) {
    delete documents[sessionId];
  } else {
    documents[sessionId] = next;
  }

  writeDocumentsFile(documents);
  return true;
}