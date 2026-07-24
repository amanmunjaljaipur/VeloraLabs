import { createChatCompletion, isLlmConfigured } from "@/lib/chat/llm-client";
import type { EmailPriority, EmailTag } from "@/lib/marketing/inbox-store";

/**
 * AI triage for the Email Suite inbox: given a message's subject + body,
 * suggest a one-line summary, a tag, and a priority - the same free LLM
 * (Groq/Gemini) the marketing AI-compose and virality features already use.
 */

export { isLlmConfigured as isEmailAiConfigured };

const VALID_TAGS: EmailTag[] = ["lead", "support", "partnership", "spam", "other"];
const VALID_PRIORITIES: EmailPriority[] = ["high", "normal", "low"];

export interface EmailTriage {
  summary: string;
  tag: EmailTag;
  priority: EmailPriority;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in AI response");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function triageEmail(input: { from: string; subject: string; body: string }): Promise<EmailTriage> {
  const system = `You triage inbound emails for a B2B/B2C AI education company (Verlin Labs).
Given a sender, subject, and body, respond with ONLY a JSON object:
{"summary": "<one sentence, under 20 words>", "tag": "lead"|"support"|"partnership"|"spam"|"other", "priority": "high"|"normal"|"low"}
"lead" = a prospective customer/student asking about pricing, enrollment, or product fit.
"partnership" = collaboration, sponsorship, or vendor outreach.
"support" = existing customer/student with a question or issue.
"spam" = unsolicited marketing/junk.
priority "high" = time-sensitive or clearly high-value (lead ready to buy, urgent support issue).`;

  const { content } = await createChatCompletion({
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `From: ${input.from}\nSubject: ${input.subject}\n\nBody:\n${input.body.slice(0, 2000)}`,
      },
    ],
    temperature: 0.2,
    maxTokens: 200,
  });

  const parsed = extractJson(content) as Partial<EmailTriage>;
  const tag = VALID_TAGS.includes(parsed.tag as EmailTag) ? (parsed.tag as EmailTag) : "other";
  const priority = VALID_PRIORITIES.includes(parsed.priority as EmailPriority)
    ? (parsed.priority as EmailPriority)
    : "normal";
  const summary = typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : "";

  return { summary, tag, priority };
}
