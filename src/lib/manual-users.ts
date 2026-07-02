import { PASSWORD_MAX_LENGTH } from "@/lib/auth-validation";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

export interface ManualUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  name: string;
  createdAt: string;
}

interface ManualUsersFile {
  users: ManualUser[];
}

const usersFilePath = path.join(process.cwd(), "content", "manual-users.json");
const SALT_ROUNDS = 12;

/** Precomputed hash used to reduce timing leaks when the email is unknown. */
const DUMMY_PASSWORD_HASH =
  "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

function ensureUsersFile(): void {
  if (!fs.existsSync(usersFilePath)) {
    writeUsersFile({ users: [] });
  }
}

function readUsersFile(): ManualUsersFile {
  ensureUsersFile();
  return JSON.parse(fs.readFileSync(usersFilePath, "utf8")) as ManualUsersFile;
}

function writeUsersFile(data: ManualUsersFile): void {
  fs.writeFileSync(usersFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  try {
    fs.chmodSync(usersFilePath, 0o600);
  } catch {
    // chmod is best-effort (e.g. Windows)
  }
}

export function getAllManualUsers(): ManualUser[] {
  return readUsersFile().users;
}

export function getManualUserByEmail(email: string): ManualUser | null {
  const normalized = email.toLowerCase().trim();
  const { users } = readUsersFile();
  return users.find((user) => user.email === normalized) ?? null;
}

export async function createManualUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<ManualUser> {
  if (input.password.length > PASSWORD_MAX_LENGTH) {
    throw new Error("invalid_password");
  }

  const normalized = input.email.toLowerCase().trim();
  const data = readUsersFile();

  if (data.users.some((user) => user.email === normalized)) {
    throw new Error("email_exists");
  }

  const user: ManualUser = {
    id: crypto.randomUUID(),
    email: normalized,
    passwordHash: await bcrypt.hash(input.password, SALT_ROUNDS),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    name: `${input.firstName.trim()} ${input.lastName.trim()}`,
    createdAt: new Date().toISOString(),
  };

  data.users.push(user);
  writeUsersFile(data);
  return user;
}

export async function verifyManualUserPassword(
  email: string,
  password: string
): Promise<ManualUser | null> {
  if (password.length > PASSWORD_MAX_LENGTH) {
    return null;
  }

  const user = getManualUserByEmail(email);
  const hashToCompare = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const valid = await bcrypt.compare(password, hashToCompare);

  if (!user || !valid) {
    return null;
  }

  return user;
}