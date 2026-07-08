import { readJsonFile, writeJsonFile } from "@/lib/data-store";

export type SessionDocumentType = "pdf" | "doc" | "slides" | "link";

export interface SessionDocumentRecord {
  title: string;
  url: string;
  type: SessionDocumentType;
  updatedAt: string;
  updatedBy: string;
}

type SessionDocumentsConfig = Record<string, SessionDocumentRecord>;

const DOCUMENTS_FILE = "session-documents.json";

function readDocumentsFile(): SessionDocumentsConfig {
  return readJsonFile<SessionDocumentsConfig>(DOCUMENTS_FILE, "{}");
}

function writeDocumentsFile(documents: SessionDocumentsConfig): void {
  writeJsonFile(DOCUMENTS_FILE, documents, "{}");
}

export function getSessionDocument(sessionId: string): SessionDocumentRecord | null {
  const documents = readDocumentsFile();
  return documents[sessionId] ?? null;
}

export function getAllSessionDocuments(): SessionDocumentsConfig {
  return readDocumentsFile();
}

export function setSessionDocument(
  sessionId: string,
  input: { title: string; url: string; type: SessionDocumentType },
  updatedBy: string
): SessionDocumentRecord {
  const documents = readDocumentsFile();
  const record: SessionDocumentRecord = {
    title: input.title.trim(),
    url: input.url.trim(),
    type: input.type,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  documents[sessionId] = record;
  writeDocumentsFile(documents);
  return record;
}

export function removeSessionDocument(sessionId: string): boolean {
  const documents = readDocumentsFile();
  if (!(sessionId in documents)) return false;
  delete documents[sessionId];
  writeDocumentsFile(documents);
  return true;
}