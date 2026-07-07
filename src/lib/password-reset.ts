import { createHash, randomBytes } from "crypto";
import { readJsonFile, writeJsonFile } from "@/lib/data-store";

const TOKENS_FILE = "password-reset-tokens.json";
const DEFAULT_STORE = '{"tokens":[]}';
const TOKEN_TTL_MS = 60 * 60 * 1000;

interface StoredResetToken {
  tokenHash: string;
  email: string;
  expiresAt: string;
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

function pruneExpired(store: ResetTokenStore): ResetTokenStore {
  const now = Date.now();
  return {
    tokens: store.tokens.filter((token) => new Date(token.expiresAt).getTime() > now),
  };
}

export function createPasswordResetToken(email: string): string {
  const normalized = email.toLowerCase().trim();
  const plainToken = randomBytes(32).toString("hex");
  const store = pruneExpired(readStore());

  store.tokens = store.tokens.filter((token) => token.email !== normalized);
  store.tokens.push({
    tokenHash: hashToken(plainToken),
    email: normalized,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });

  writeStore(store);
  return plainToken;
}

export function consumePasswordResetToken(plainToken: string): string | null {
  const store = pruneExpired(readStore());
  const tokenHash = hashToken(plainToken);
  const match = store.tokens.find((token) => token.tokenHash === tokenHash);

  if (!match) {
    return null;
  }

  store.tokens = store.tokens.filter((token) => token.tokenHash !== tokenHash);
  writeStore(store);
  return match.email;
}