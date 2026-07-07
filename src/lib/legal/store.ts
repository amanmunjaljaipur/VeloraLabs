import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import { createDefaultLegalCms } from "./default-content";
import type { LegalCmsData, LegalDocType, LegalDocument, PublicLegalDocument } from "./types";

const LEGAL_FILE = "legal-documents.json";

function docKey(type: LegalDocType): keyof LegalCmsData {
  return type;
}

function isCompleteCms(data: Partial<LegalCmsData>): data is LegalCmsData {
  return Boolean(
    data.terms?.sections?.length &&
      data.privacy?.sections?.length &&
      data.refund?.sections?.length
  );
}

function mergeWithDefaults(data: Partial<LegalCmsData>): LegalCmsData {
  const defaults = createDefaultLegalCms();
  return {
    terms: data.terms?.sections?.length ? data.terms : defaults.terms,
    privacy: data.privacy?.sections?.length ? data.privacy : defaults.privacy,
    refund: data.refund?.sections?.length ? data.refund : defaults.refund,
  };
}

export function readLegalCms(): LegalCmsData {
  try {
    const data = readJsonFile<Partial<LegalCmsData>>(LEGAL_FILE, "{}");
    if (isCompleteCms(data)) {
      return data;
    }
    if (data.terms?.sections?.length || data.privacy?.sections?.length) {
      const merged = mergeWithDefaults(data);
      writeJsonFile(LEGAL_FILE, merged);
      return merged;
    }
  } catch {
    // seed below
  }
  const seeded = createDefaultLegalCms();
  writeJsonFile(LEGAL_FILE, seeded);
  return seeded;
}

export function writeLegalCms(data: LegalCmsData): void {
  writeJsonFile(LEGAL_FILE, data);
}

export function getPublicDocument(type: LegalDocType): PublicLegalDocument {
  const cms = readLegalCms();
  const doc = cms[docKey(type)];
  return {
    type: doc.type,
    title: doc.title,
    version: doc.version,
    lastUpdated: doc.lastUpdated,
    disclaimer: doc.disclaimer,
    sections: doc.sections,
  };
}

export function updateLegalDocument(
  type: LegalDocType,
  updates: Pick<LegalDocument, "disclaimer" | "sections">,
  updatedBy?: string
): LegalDocument {
  const cms = readLegalCms();
  const key = docKey(type);
  const current = cms[key];

  const next: LegalDocument = {
    ...current,
    disclaimer: updates.disclaimer,
    sections: updates.sections,
    version: current.version + 1,
    lastUpdated: new Date().toISOString().slice(0, 10),
    updatedBy,
  };

  cms[key] = next;
  writeLegalCms(cms);
  return next;
}

export function getCurrentVersions(): { termsVersion: number; privacyVersion: number } {
  const cms = readLegalCms();
  return { termsVersion: cms.terms.version, privacyVersion: cms.privacy.version };
}