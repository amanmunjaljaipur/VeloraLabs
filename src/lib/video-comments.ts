import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import type { UserRole } from "@/types/roles";
import { randomUUID } from "crypto";

export interface VideoComment {
  id: string;
  sessionId: string;
  email: string;
  authorName: string;
  role: UserRole;
  body: string;
  createdAt: string;
}

const COMMENTS_FILE = "video-comments.json";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readComments(): VideoComment[] {
  return readJsonFile<VideoComment[]>(COMMENTS_FILE, "[]");
}

function writeComments(comments: VideoComment[]): void {
  writeJsonFile(COMMENTS_FILE, comments, "[]");
}

export function getCommentsForSession(sessionId: string): VideoComment[] {
  return readComments()
    .filter((comment) => comment.sessionId === sessionId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getAllVideoComments(): VideoComment[] {
  return readComments().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addVideoComment(input: {
  sessionId: string;
  email: string;
  authorName: string;
  role: UserRole;
  body: string;
}): VideoComment {
  const comment: VideoComment = {
    id: randomUUID(),
    sessionId: input.sessionId,
    email: normalizeEmail(input.email),
    authorName: input.authorName.trim() || input.email,
    role: input.role,
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
  };

  const comments = readComments();
  comments.push(comment);
  writeComments(comments);
  return comment;
}

export function deleteVideoComment(commentId: string): boolean {
  const comments = readComments();
  const index = comments.findIndex((comment) => comment.id === commentId);
  if (index < 0) return false;
  comments.splice(index, 1);
  writeComments(comments);
  return true;
}

export function getCommentCountsBySession(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const comment of readComments()) {
    counts[comment.sessionId] = (counts[comment.sessionId] ?? 0) + 1;
  }
  return counts;
}