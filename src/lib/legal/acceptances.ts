import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import { isLegalAcceptanceCurrent } from "./acceptance-versions";
import { getCurrentVersions } from "./store";
import type { LegalAcceptanceRecord } from "./types";

export { isLegalAcceptanceCurrent } from "./acceptance-versions";
export type { LegalVersionPair } from "./acceptance-versions";

const ACCEPTANCES_FILE = "legal-acceptances.json";

type AcceptancesFile = Record<string, LegalAcceptanceRecord>;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readAcceptances(): AcceptancesFile {
  return readJsonFile<AcceptancesFile>(ACCEPTANCES_FILE, "{}");
}

function writeAcceptances(data: AcceptancesFile): void {
  writeJsonFile(ACCEPTANCES_FILE, data);
}

export function getLegalAcceptance(email: string): LegalAcceptanceRecord | null {
  const key = normalizeEmail(email);
  return readAcceptances()[key] ?? null;
}

export function recordLegalAcceptance(email: string): LegalAcceptanceRecord {
  const key = normalizeEmail(email);
  const versions = getCurrentVersions();
  const record: LegalAcceptanceRecord = {
    email: key,
    termsVersion: versions.termsVersion,
    privacyVersion: versions.privacyVersion,
    acceptedAt: new Date().toISOString(),
  };

  const all = readAcceptances();
  all[key] = record;
  writeAcceptances(all);
  return record;
}

export type LegalAcceptanceVersions = Pick<
  LegalAcceptanceRecord,
  "termsVersion" | "privacyVersion"
>;

function hasCurrentAcceptance(
  email: string,
  current: LegalAcceptanceVersions,
  sources: Array<LegalAcceptanceVersions | null | undefined>
): boolean {
  if (sources.some((source) => isLegalAcceptanceCurrent(source, current))) {
    return true;
  }
  return isLegalAcceptanceCurrent(getLegalAcceptance(email), current);
}

/** Session/cookie survive deploys; file storage is ephemeral on serverless. */
export function needsLegalAcceptance(
  email: string,
  sessionAccepted?: LegalAcceptanceVersions | null,
  cookieAccepted?: LegalAcceptanceVersions | null
): boolean {
  const current = getCurrentVersions();
  return !hasCurrentAcceptance(email, current, [sessionAccepted, cookieAccepted]);
}