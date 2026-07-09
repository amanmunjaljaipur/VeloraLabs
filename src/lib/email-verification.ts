import { createHash, randomBytes, randomInt } from "crypto";
import { readJsonFile, writeJsonFile } from "@/lib/data-store";

const CHALLENGES_FILE = "email-verification-challenges.json";
const DEFAULT_STORE = '{"challenges":[]}';
const CHALLENGE_TTL_MS = 24 * 60 * 60 * 1000;

export interface EmailVerificationChallenge {
  email: string;
  tokenHash: string;
  codeHash: string;
  expiresAt: string;
  createdAt: string;
}

interface ChallengeStore {
  challenges: EmailVerificationChallenge[];
}

export interface CreatedEmailVerificationChallenge {
  plainToken: string;
  plainCode: string;
  expiresAt: string;
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function readStore(): ChallengeStore {
  return readJsonFile<ChallengeStore>(CHALLENGES_FILE, DEFAULT_STORE);
}

function writeStore(store: ChallengeStore): void {
  writeJsonFile(CHALLENGES_FILE, store, DEFAULT_STORE);
}

function pruneExpired(challenges: EmailVerificationChallenge[]): EmailVerificationChallenge[] {
  const now = Date.now();
  return challenges.filter((challenge) => new Date(challenge.expiresAt).getTime() > now);
}

function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

export function createEmailVerificationChallenge(
  email: string
): CreatedEmailVerificationChallenge {
  const normalized = normalizeEmail(email);
  const plainToken = randomBytes(32).toString("hex");
  const plainCode = generateVerificationCode();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();

  const active = pruneExpired(readStore().challenges).filter(
    (challenge) => challenge.email !== normalized
  );

  active.push({
    email: normalized,
    tokenHash: hashValue(plainToken),
    codeHash: hashValue(plainCode),
    expiresAt,
    createdAt,
  });

  writeStore({ challenges: active });

  return { plainToken, plainCode, expiresAt };
}

function findChallengeByEmail(email: string): EmailVerificationChallenge | null {
  const normalized = normalizeEmail(email);
  return (
    pruneExpired(readStore().challenges).find((challenge) => challenge.email === normalized) ??
    null
  );
}

function removeChallenge(email: string): void {
  const normalized = normalizeEmail(email);
  const challenges = pruneExpired(readStore().challenges).filter(
    (challenge) => challenge.email !== normalized
  );
  writeStore({ challenges });
}

export function verifyEmailByToken(plainToken: string): string | null {
  const tokenHash = hashValue(plainToken.trim());
  const match = pruneExpired(readStore().challenges).find(
    (challenge) => challenge.tokenHash === tokenHash
  );
  if (!match) return null;
  removeChallenge(match.email);
  return match.email;
}

export function verifyEmailByCode(email: string, plainCode: string): boolean {
  const normalized = normalizeEmail(email);
  const sanitizedCode = plainCode.trim().replace(/\s/g, "");
  const match = findChallengeByEmail(normalized);
  if (!match) return false;
  if (match.codeHash !== hashValue(sanitizedCode)) return false;
  removeChallenge(normalized);
  return true;
}

export function hasActiveVerificationChallenge(email: string): boolean {
  return findChallengeByEmail(email) !== null;
}