import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { listInboxEntries, syncInbox, updateInboxEntry, type InboxEntry } from "@/lib/marketing/inbox-store";
import { triageEmail } from "@/lib/marketing/ai-email-assist";
import { upsertLead } from "@/lib/marketing/leads-store";
import { isLlmConfigured } from "@/lib/chat/llm-client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entries = await listInboxEntries();
  return NextResponse.json({ entries });
}

/**
 * POST { action: "sync" } - pull new messages from IMAP, AI-triage the
 * ones that are new, and auto-create a lead for anything tagged "lead".
 * POST { action: "update", uid, patch } - manual tag/priority/read/archive edit.
 */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === "sync") {
    const { synced } = await syncInbox(50);
    let triaged = 0;

    if (synced > 0 && isLlmConfigured()) {
      const entries = await listInboxEntries();
      const untriaged = entries.filter((e) => !e.aiSummary).slice(0, 20);
      for (const entry of untriaged) {
        try {
          const triage = await triageEmail({ from: entry.from, subject: entry.subject, body: entry.bodyText });
          await updateInboxEntry(entry.uid, {
            aiSummary: triage.summary || null,
            tag: triage.tag,
            priority: triage.priority,
          });
          triaged += 1;
          if (triage.tag === "lead") {
            await upsertLead({ email: entry.from, name: entry.fromName, source: "inbox" });
          }
        } catch (error) {
          console.error(`Email triage failed for uid ${entry.uid}:`, error);
        }
      }
    }

    return NextResponse.json({ synced, triaged });
  }

  if (action === "update") {
    const uid = Number(body?.uid);
    if (!Number.isFinite(uid)) {
      return NextResponse.json({ error: "uid required" }, { status: 400 });
    }
    const patch = body?.patch ?? {};
    const cleanPatch: Partial<Pick<InboxEntry, "tag" | "priority" | "read" | "archived">> = {};
    if (typeof patch.tag === "string") cleanPatch.tag = patch.tag;
    if (typeof patch.priority === "string") cleanPatch.priority = patch.priority;
    if (typeof patch.read === "boolean") cleanPatch.read = patch.read;
    if (typeof patch.archived === "boolean") cleanPatch.archived = patch.archived;
    const entry = await updateInboxEntry(uid, cleanPatch);
    if (!entry) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    return NextResponse.json({ entry });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
