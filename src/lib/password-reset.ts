import { createHash, randomBytes } from "crypto";
import { readJsonFile, writeJsonFile } from "@/lib/data-store";

const TOKENS_FILE = "password-reset-tokens.json";
const DEFAULT_STORE = '{"tokens":[]}';
const TOKEN_TTL_MS = 60 * 60 * 1000;

interface StoredResetToken {
  tokenHash: string;
  email: string;
  expiresAt: string;
  createdAt?: string;
}

interface ResetTokenStore {
  tokens: StoredResetToken[];
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function readStore(): ResetTokenStore {
  return readJsonFile<ResetTokenStore>(TOKENS_FILE, DEFAULT_STORE);
}

function writeStore(store: ResetTokenStore): void {
  writeJsonFile(TOKENS_FILE, store, DEFAULT_STORE);
}

function pruneExpired(tokens: StoredResetToken[]): StoredResetToken[] {
  const now = Date.now();
  return tokens.filter((token) => new Date(token.expiresAt).getTime() > now);
}

function readActiveTokens(): StoredResetToken[] {
  return pruneExpired(readStore().tokens);
}

function writeActiveTokens(tokens: StoredResetToken[]): void {
  writeStore({ tokens: pruneExpired(tokens) });
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const plainToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const createdAt = new Date().toISOString();
  const active = readActiveTokens().filter((token) => token.email !== normalized);

  active.push({
    tokenHash: hashToken(plainToken),
    email: normalized,
    expiresAt,
    createdAt,
  });

  writeActiveTokens(active);
  return plainToken;
}

export async function consumePasswordResetToken(plainToken: string): Promise<string | null> {
  const tokenHash = hashToken(plainToken);
  const active = readActiveTokens();
  const match = active.find((token) => token.tokenHash === tokenHash);

  if (!match) {
    return null;
  }

  writeActiveTokens(active.filter((token) => token.tokenHash !== tokenHash));
  return match.email;
}