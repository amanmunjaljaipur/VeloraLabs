import type { AudienceSlug } from "@/lib/content";
import fs from "fs";
import path from "path";

export interface UserCourseProgress {
  completedDays: number[];
  updatedAt: string;
}

type CourseProgressFile = Record<string, UserCourseProgress>;

const progressFilePath = path.join(process.cwd(), "content", "course-progress.json");

function readProgressFile(): CourseProgressFile {
  return JSON.parse(fs.readFileSync(progressFilePath, "utf8")) as CourseProgressFile;
}

function writeProgressFile(data: CourseProgressFile): void {
  fs.writeFileSync(progressFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function getCourseProgress(email: string | null | undefined): UserCourseProgress {
  if (!email) {
    return { completedDays: [], updatedAt: new Date().toISOString() };
  }

  const data = readProgressFile();
  return (
    data[email.toLowerCase()] ?? {
      completedDays: [],
      updatedAt: new Date().toISOString(),
    }
  );
}

export function isDayCompleted(
  email: string | null | undefined,
  day: number
): boolean {
  if (!email) return false;
  return getCourseProgress(email).completedDays.includes(day);
}

export function markDayComplete(
  email: string,
  audience: AudienceSlug,
  day: number,
  validDays: number[]
): UserCourseProgress {
  if (!validDays.includes(day)) {
    return getCourseProgress(email);
  }

  const normalized = email.toLowerCase().trim();
  const data = readProgressFile();
  const existing = data[normalized] ?? { completedDays: [], updatedAt: new Date().toISOString() };
  const completedDays = Array.from(new Set([...existing.completedDays, day])).sort((a, b) => a - b);

  const updated: UserCourseProgress = {
    completedDays,
    updatedAt: new Date().toISOString(),
  };

  data[normalized] = updated;
  writeProgressFile(data);
  return updated;
}