import { createChatCompletion, isLlmConfigured } from "@/lib/chat/llm-client";
import { listPublicAccounts } from "@/lib/marketing/accounts-store";
import { listMarketingPosts } from "@/lib/marketing/posts-store";
import { listScheduledPosts, createScheduledPost } from "@/lib/marketing/scheduled-posts-store";
import { listLeads } from "@/lib/marketing/leads-store";
import { listCampaigns } from "@/lib/marketing/campaigns-store";
import { listInboxEntries, syncInbox, updateInboxEntry } from "@/lib/marketing/inbox-store";
import { triageEmail } from "@/lib/marketing/ai-email-assist";
import { upsertLead } from "@/lib/marketing/leads-store";
import { generateViralIdeas, type ViralPlatform } from "@/lib/marketing/viral-ideas";
import { generateMarketingImage, isAiImageConfigured } from "@/lib/marketing/ai-image";
import { publishToAccounts } from "@/lib/marketing/publisher";
import { recordMarketingPost } from "@/lib/marketing/posts-store";
import { findProspects, guessEmailPatterns } from "@/lib/marketing/ai-prospect-finder";
import { addProspects } from "@/lib/marketing/prospects-store";
import {
  appendGrowthMemory,
  listGrowthMemory,
  type GrowthAction,
  type GrowthExecutionResult,
  type GrowthInsight,
  type GrowthMemoryEntry,
} from "@/lib/marketing/growth-memory-store";

export { isLlmConfigured as isGrowthAdvisorConfigured };

/**
 * The AI Growth Advisor: "what's going on, how can it improve" as a single
 * button, "just do it" as another. Reuses the SAME free Groq/Gemini client
 * (chat/llm-client.ts) as every other AI feature on the board - no new
 * provider, per the standing instruction to keep everything on one LLM.
 *
 * Strategy = gatherSignals() (real counts from every store) + the last few
 * days of growth-memory-store.ts entries, fed to the LLM to produce
 * insights + a short list of concrete, executable actions.
 *
 * Execute = runs those actions for real through the SAME functions the
 * rest of the board already uses (viral-ideas + scheduler for posts,
 * inbox sync + triage for the inbox, prospect finder for pipeline) - no
 * separate "simulate" path, so a button press has a real, visible effect.
 * Deliberately scoped to safe, reviewable actions (draft/schedule, never a
 * blind mass email send) so autopilot can't spam real inboxes unattended.
 */

interface Signals {
  connectedPlatforms: ViralPlatform[];
  postsLast30: number;
  scheduledCount: number;
  leadsByStatus: Record<string, number>;
  campaignsSent: number;
  campaignsFailed: number;
  inboxUnread: number;
  inboxByTag: Record<string, number>;
  summaryLine: string;
}

async function gatherSignals(tenantId: string): Promise<Signals> {
  const [accounts, posts, scheduled, leads, campaigns, inbox] = await Promise.all([
    listPublicAccounts(tenantId),
    listMarketingPosts(tenantId),
    listScheduledPosts(tenantId),
    listLeads(tenantId),
    listCampaigns(tenantId),
    listInboxEntries(tenantId),
  ]);

  const connectedPlatforms = Array.from(new Set(accounts.map((a) => a.platform))) as ViralPlatform[];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const postsLast30 = posts.filter((p) => new Date(p.createdAt).getTime() >= thirtyDaysAgo).length;

  const leadsByStatus: Record<string, number> = {};
  for (const lead of leads) leadsByStatus[lead.status] = (leadsByStatus[lead.status] ?? 0) + 1;

  const inboxByTag: Record<string, number> = {};
  for (const entry of inbox) inboxByTag[entry.tag] = (inboxByTag[entry.tag] ?? 0) + 1;

  const campaignsSent = campaigns.filter((c) => c.status === "sent").reduce((sum, c) => sum + c.sentCount, 0);
  const campaignsFailed = campaigns.filter((c) => c.status === "sent").reduce((sum, c) => sum + c.failedCount, 0);

  const summaryLine = `${connectedPlatforms.length} platform(s) connected (${connectedPlatforms.join(", ") || "none"}). ${postsLast30} posts in last 30 days, ${scheduled.length} scheduled. ${leads.length} leads (${Object.entries(leadsByStatus).map(([k, v]) => `${v} ${k}`).join(", ") || "none"}). ${campaignsSent} campaign emails sent, ${campaignsFailed} failed. ${inbox.length} inbox messages cached, ${inbox.filter((e) => !e.read).length} unread.`;

  return {
    connectedPlatforms,
    postsLast30,
    scheduledCount: scheduled.length,
    leadsByStatus,
    campaignsSent,
    campaignsFailed,
    inboxUnread: inbox.filter((e) => !e.read).length,
    inboxByTag,
    summaryLine,
  };
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in AI response");
  return JSON.parse(candidate.slice(start, end + 1));
}

const KNOWN_ACTIONS = [
  { key: "schedule_viral_post", label: "Generate and schedule a viral post" },
  { key: "sync_and_triage_inbox", label: "Sync inbox and AI-triage new messages" },
  { key: "find_prospects", label: "Find new cold-outreach prospects with AI" },
] as const;

export async function generateStrategy(
  tenantId: string,
  triggeredBy: "manual" | "daily-cron"
): Promise<GrowthMemoryEntry> {
  const signals = await gatherSignals(tenantId);
  const history = await listGrowthMemory(tenantId, 5);
  const historyBlock =
    history.length > 0
      ? history
          .map((h) => `${h.createdAt.slice(0, 10)}: ${h.strategySummary}${h.executedActions ? ` (executed: ${h.executedActions.map((a) => a.label).join(", ")})` : ""}`)
          .join("\n")
      : "No prior history - this is the first strategy run.";

  const system = `You are a growth advisor for a Marketing Board product (social + email outreach for a company called Verlin Labs). Given today's metrics and the recent history of advice already given, respond with ONLY a JSON object:
{"summary": "<one paragraph, 2-3 sentences, plain-spoken read of what's going on>", "insights": [{"observation": "...", "recommendation": "...", "priority": "high"|"medium"|"low"}], "suggestedActions": [{"key": "schedule_viral_post"|"sync_and_triage_inbox"|"find_prospects", "label": "...", "rationale": "..."}]}
Only use action keys from this exact list: schedule_viral_post, sync_and_triage_inbox, find_prospects - these are the only actions this product can currently execute automatically. Give 2-4 insights and 1-3 suggested actions, prioritized by what would move the needle most right now. Don't repeat advice already given in the history unless the underlying number hasn't moved - if so, say so plainly (e.g. "leads are still stuck at 0, try X instead of Y").`;

  const { content } = await createChatCompletion({
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `Today's signals:\n${signals.summaryLine}\n\nRecent advice history:\n${historyBlock}`,
      },
    ],
    temperature: 0.4,
    maxTokens: 900,
  });

  const parsed = extractJson(content) as {
    summary?: string;
    insights?: Array<Partial<GrowthInsight>>;
    suggestedActions?: Array<Partial<GrowthAction>>;
  };

  const insights: GrowthInsight[] = (parsed.insights ?? [])
    .filter((i) => typeof i.observation === "string" && typeof i.recommendation === "string")
    .map((i) => ({
      observation: i.observation as string,
      recommendation: i.recommendation as string,
      priority: (["high", "medium", "low"] as const).includes(i.priority as never) ? (i.priority as GrowthInsight["priority"]) : "medium",
    }));

  const validKeys = new Set(KNOWN_ACTIONS.map((a) => a.key));
  const suggestedActions: GrowthAction[] = (parsed.suggestedActions ?? [])
    .filter((a) => typeof a.key === "string" && validKeys.has(a.key as never))
    .map((a) => ({
      key: a.key as string,
      label: a.label ?? KNOWN_ACTIONS.find((k) => k.key === a.key)?.label ?? a.key!,
      rationale: a.rationale ?? "",
    }));

  return appendGrowthMemory({
    tenantId,
    signalsSummary: signals.summaryLine,
    strategySummary: typeof parsed.summary === "string" ? parsed.summary : "No summary returned",
    insights,
    suggestedActions,
    triggeredBy,
  });
}

/** Runs the given action keys for real, through the same primitives the rest of the board uses. */
export async function executeGrowthActions(
  tenantId: string,
  actionKeys: string[]
): Promise<GrowthExecutionResult[]> {
  const results: GrowthExecutionResult[] = [];

  for (const key of actionKeys) {
    const label = KNOWN_ACTIONS.find((a) => a.key === key)?.label ?? key;
    try {
      if (key === "schedule_viral_post") {
        const accounts = await listPublicAccounts(tenantId);
        const platforms = Array.from(new Set(accounts.map((a) => a.platform))) as ViralPlatform[];
        if (platforms.length === 0) {
          results.push({ key, label, ok: false, detail: "No connected accounts to post to" });
          continue;
        }
        const ideas = await generateViralIdeas({ platforms });
        const top = [...ideas].sort((a, b) => b.viralityScore - a.viralityScore)[0];
        if (!top) {
          results.push({ key, label, ok: false, detail: "AI did not return a usable idea" });
          continue;
        }
        const matchingAccounts = accounts.filter((a) => a.platform === top.platform).map((a) => a.id);
        let imageUrl: string | null = null;
        if (top.format !== "text-only" && isAiImageConfigured()) {
          const img = await generateMarketingImage(top.imagePrompt || top.hook);
          if (img.ok) imageUrl = img.url;
        }
        const content = [top.hook, top.content, top.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")]
          .filter(Boolean)
          .join("\n\n");
        const targets = await publishToAccounts(tenantId, matchingAccounts, content, imageUrl);
        await recordMarketingPost({ tenantId, content, imageUrl, targets, createdBy: "growth-advisor" });
        const anyPublished = targets.some((t) => t.status === "published");
        results.push({
          key,
          label,
          ok: anyPublished,
          detail: anyPublished
            ? `Posted "${top.hook || top.topic}" to ${top.platform} (virality score ${top.viralityScore})`
            : "Publish failed on all targets",
        });
      } else if (key === "sync_and_triage_inbox") {
        const { synced } = await syncInbox(tenantId, 50);
        let triaged = 0;
        if (synced > 0 && isLlmConfigured()) {
          const entries = await listInboxEntries(tenantId);
          const untriaged = entries.filter((e) => !e.aiSummary).slice(0, 15);
          for (const entry of untriaged) {
            const triage = await triageEmail({ from: entry.from, subject: entry.subject, body: entry.bodyText });
            await updateInboxEntry(entry.uid, tenantId, {
              aiSummary: triage.summary || null,
              tag: triage.tag,
              priority: triage.priority,
            });
            triaged += 1;
            if (triage.tag === "lead") {
              await upsertLead({ tenantId, email: entry.from, name: entry.fromName, source: "inbox" });
            }
          }
        }
        results.push({ key, label, ok: true, detail: `${synced} new message(s) synced, ${triaged} AI-triaged` });
      } else if (key === "find_prospects") {
        const signals = await gatherSignals(tenantId);
        const prompt =
          signals.connectedPlatforms.length > 0
            ? `Decision-makers likely to be interested in an AI education/products company that publishes on ${signals.connectedPlatforms.join(", ")}`
            : "Decision-makers likely to be interested in an AI education and AI tooling company";
        const suggestions = await findProspects(prompt, 5);
        const created = await addProspects(
          tenantId,
          prompt,
          suggestions.map((s) => ({
            name: s.name,
            title: s.title,
            company: s.company,
            domain: s.domain,
            guessedEmails: guessEmailPatterns(s.name, s.domain),
            rationale: s.rationale,
          }))
        );
        results.push({ key, label, ok: true, detail: `${created.length} new prospect(s) suggested - review in Email Suite` });
      } else {
        results.push({ key, label, ok: false, detail: "Unknown action" });
      }
    } catch (error) {
      results.push({ key, label, ok: false, detail: error instanceof Error ? error.message : "Action failed" });
    }
  }

  return results;
}
