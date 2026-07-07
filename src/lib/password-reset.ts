import { createHash, randomBytes } from "crypto";
import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import {
  isServiceAccountConfigured,
  persistPasswordResetTokensToSheet,
  readPasswordResetTokensFromSheet,
  type PasswordResetTokenSheetRow,
} from "@/lib/google-sheets-service";

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

function toSheetRows(tokens: StoredResetToken[]): PasswordResetTokenSheetRow[] {
  return tokens.map((token) => ({
    tokenHash: token.tokenHash,
    email: token.email,
    expiresAt: token.expiresAt,
    createdAt: token.createdAt ?? token.expiresAt,
  }));
}

async function readActiveTokens(): Promise<StoredResetToken[]> {
  if (isServiceAccountConfigured()) {
    try {
      const rows = await readPasswordResetTokensFromSheet();
      return pruneExpired(
        rows.map((row) => ({
          tokenHash: row.tokenHash,
          email: row.email,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
        }))
      );
    } catch (error) {
      console.error("Failed to read password reset tokens from Sheets:", error);
    }
  }

  return pruneExpired(readStore().tokens);
}

async function writeActiveTokens(tokens: StoredResetToken[]): Promise<void> {
  const active = pruneExpired(tokens);

  if (isServiceAccountConfigured()) {
    try {
      await persistPasswordResetTokensToSheet(toSheetRows(active));
      return;
    } catch (error) {
      console.error("Failed to persist password reset tokens to Sheets:", error);
    }
  }

  writeStore({ tokens: active });
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const plainToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const createdAt = new Date().toISOString();
  const active = (await readActiveTokens()).filter((token) => token.email !== normalized);

  active.push({
    tokenHash: hashToken(plainToken),
    email: normalized,
    expiresAt,
    createdAt,
  });

  await writeActiveTokens(active);
  return plainToken;
}

export async function consumePasswordResetToken(plainToken: string): Promise<string | null> {
  const tokenHash = hashToken(plainToken);
  const active = await readActiveTokens();
  const match = active.find((token) => token.tokenHash === tokenHash);

  if (!match) {
    return null;
  }

  await writeActiveTokens(active.filter((token) => token.tokenHash !== tokenHash));
  return match.email;
}