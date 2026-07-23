import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import type { AudienceSlug, Testimonial } from "@/lib/content";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface TestimonialSubmission {
  id: string;
  quote: string;
  name: string;
  role: string;
  audience: AudienceSlug;
  image: string | null;
  email: string;
  authProvider: "linkedin" | "google" | "credentials";
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

const SUBMISSIONS_FILE = "testimonial-submissions.json";
const DEFAULT_JSON = "[]";

async function readAll(): Promise<TestimonialSubmission[]> {
  await ensureDataFileHydrated(SUBMISSIONS_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<TestimonialSubmission[]>(SUBMISSIONS_FILE, DEFAULT_JSON);
}

async function writeAll(items: TestimonialSubmission[]): Promise<void> {
  await writeJsonFileAsync(SUBMISSIONS_FILE, items, DEFAULT_JSON);
}

export async function listSubmissions(status?: SubmissionStatus): Promise<TestimonialSubmission[]> {
  const all = await readAll();
  const sorted = [...all].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return status ? sorted.filter((s) => s.status === status) : sorted;
}

export async function createSubmission(input: {
  quote: string;
  name: string;
  role: string;
  audience: AudienceSlug;
  image: string | null;
  email: string;
  authProvider: "linkedin" | "google" | "credentials";
}): Promise<TestimonialSubmission> {
  const all = await readAll();

  const record: TestimonialSubmission = {
    id: `testimonial-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    quote: input.quote.trim(),
    name: input.name.trim(),
    role: input.role.trim(),
    audience: input.audience,
    image: input.image,
    email: input.email,
    authProvider: input.authProvider,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  all.push(record);
  await writeAll(all);
  return record;
}

export async function setSubmissionStatus(
  id: string,
  status: "approved" | "rejected",
  reviewedBy: string
): Promise<TestimonialSubmission | null> {
  const all = await readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx]!,
    status,
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  };
  await writeAll(all);
  return all[idx]!;
}

/** Approved submissions, shaped to slot directly alongside the static testimonials.json entries. */
export async function getApprovedSubmissionsAsTestimonials(): Promise<Testimonial[]> {
  const approved = await listSubmissions("approved");
  return approved.map((s) => ({
    id: s.id,
    quote: s.quote,
    name: s.name,
    role: s.role,
    audience: s.audience,
    image: s.image,
  }));
}
