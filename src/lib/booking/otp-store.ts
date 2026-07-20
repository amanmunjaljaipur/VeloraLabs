import { createHash, randomBytes, randomInt } from "crypto";
import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";
import type { BookingAudience } from "@/lib/booking/store";

const CHALLENGES_FILE = "booking-otp-challenges.json";
const DEFAULT_STORE = '{"challenges":[]}';
/** Short TTL - this is a live booking flow, not an account-verification email. */
const CHALLENGE_TTL_MS = 10 * 60 * 1000;

export interface BookingOtpPayload {
  date: string;
  slotId: string;
  name: string;
  email: string;
  audience: BookingAudience;
}

interface BookingOtpChallenge {
  id: string;
  codeHash: string;
  payload: BookingOtpPayload;
  expiresAt: string;
  createdAt: string;
  attempts: number;
}

interface ChallengeStore {
  challenges: BookingOtpChallenge[];
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function readLocal(): ChallengeStore {
  const data = readJsonFile<ChallengeStore>(CHALLENGES_FILE, DEFAULT_STORE);
  return { challenges: Array.isArray(data.challenges) ? data.challenges : [] };
}

/**
 * Force-hydrate from Blob before every read. The 10-minute OTP window makes
 * this especially important: "request" and "verify" almost always land on
 * two different serverless instances on Vercel, so without a forced
 * re-pull, "verify" would read a stale local /tmp copy that never saw the
 * challenge "request" just created - every code would fail as "not found".
 */
async function readStore(): Promise<ChallengeStore> {
  await ensureDataFileHydrated(CHALLENGES_FILE, DEFAULT_STORE, { force: true });
  return readLocal();
}

async function writeStore(store: ChallengeStore): Promise<void> {
  await writeJsonFileAsync(CHALLENGES_FILE, store, DEFAULT_STORE);
}

function pruneExpired(challenges: BookingOtpChallenge[]): BookingOtpChallenge[] {
  const now = Date.now();
  return challenges.filter((c) => new Date(c.expiresAt).getTime() > now);
}

function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

const MAX_ATTEMPTS = 5;

export interface CreatedBookingOtpChallenge {
  challengeId: string;
  plainCode: string;
  expiresAt: string;
}

/**
 * Creates an OTP challenge holding the FULL intended booking payload, so the
 * slot is only ever written once - at verify time, after the email is
 * proven to belong to the person booking it. Nothing is reserved/held at
 * request time (no phantom holds to clean up), the capacity check simply
 * happens again at verify time.
 */
export async function createBookingOtpChallenge(
  payload: BookingOtpPayload
): Promise<CreatedBookingOtpChallenge> {
  const id = randomBytes(16).toString("hex");
  const plainCode = generateCode();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();

  const normalizedEmail = payload.email.trim().toLowerCase();
  const store = await readStore();
  const active = pruneExpired(store.challenges).filter(
    (c) => c.payload.email !== normalizedEmail
  );

  active.push({
    id,
    codeHash: hashValue(plainCode),
    payload: { ...payload, email: normalizedEmail },
    expiresAt,
    createdAt,
    attempts: 0,
  });

  await writeStore({ challenges: active });

  return { challengeId: id, plainCode, expiresAt };
}

export type VerifyOtpResult =
  | { ok: true; payload: BookingOtpPayload }
  | { ok: false; error: "not_found" | "expired" | "invalid_code" | "too_many_attempts" };

export async function verifyBookingOtp(
  challengeId: string,
  plainCode: string
): Promise<VerifyOtpResult> {
  const store = await readStore();
  const challenges = pruneExpired(store.challenges);
  const match = challenges.find((c) => c.id === challengeId);

  if (!match) return { ok: false, error: "not_found" };

  if (match.attempts >= MAX_ATTEMPTS) {
    await writeStore({ challenges: challenges.filter((c) => c.id !== challengeId) });
    return { ok: false, error: "too_many_attempts" };
  }

  const sanitized = plainCode.trim().replace(/\s/g, "");
  if (hashValue(sanitized) !== match.codeHash) {
    match.attempts += 1;
    await writeStore({ challenges });
    return { ok: false, error: "invalid_code" };
  }

  // Correct code - consume the challenge so it cannot be replayed.
  await writeStore({ challenges: challenges.filter((c) => c.id !== challengeId) });
  return { ok: true, payload: match.payload };
}
