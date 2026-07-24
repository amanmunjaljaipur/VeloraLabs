import { createChatCompletion, isLlmConfigured } from "@/lib/chat/llm-client";

export { isLlmConfigured as isProspectFinderConfigured };

/**
 * "Find me the right people for cold outreach" - given a free-text ICP
 * prompt ("VP Marketing at 20-50 person B2B SaaS companies"), the free LLM
 * brainstorms a target-profile list (company type, role, why they fit) and
 * this module pattern-guesses likely email addresses for any profile that
 * includes a real company domain.
 *
 * Important honesty note (also surfaced in the UI): this app has no paid
 * contact-enrichment API (Apollo/Clay/ZoomInfo/Hunter etc.) wired in, so
 * results are AI-suggested target PROFILES, not a verified contact
 * database - the LLM can name real companies but cannot look up a real
 * person's actual inbox. Every result is status "suggested" until a human
 * confirms it and promotes it to a real lead.
 */

export interface ProspectSuggestion {
  name: string | null;
  title: string | null;
  company: string;
  domain: string | null;
  rationale: string;
}

function extractJsonArray(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found in AI response");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function findProspects(prompt: string, count = 8): Promise<ProspectSuggestion[]> {
  const system = `You help a B2B seller build a cold-outreach target list. Given a description of their ideal customer, respond with ONLY a JSON array of ${count} target profiles:
[{"name": "<a plausible role title standing in for a real named contact, or null if you don't have one>", "title": "<job title>", "company": "<a REAL company name that plausibly fits, only if you are confident it exists>", "domain": "<that company's real domain, e.g. acme.com, or null if unsure>", "rationale": "<one sentence: why this profile fits the ask>"}]
Only include a company/domain you are reasonably confident is real - use null rather than inventing one. Prioritize variety across company sizes/sub-niches within the ask.`;

  const { content } = await createChatCompletion({
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
    maxTokens: 1200,
  });

  const parsed = extractJsonArray(content);
  if (!Array.isArray(parsed)) throw new Error("AI response was not a list");

  return parsed.slice(0, count).map((item) => {
    const p = item as Partial<ProspectSuggestion>;
    return {
      name: typeof p.name === "string" && p.name.trim() ? p.name.trim() : null,
      title: typeof p.title === "string" && p.title.trim() ? p.title.trim() : null,
      company: typeof p.company === "string" && p.company.trim() ? p.company.trim() : "Unknown company",
      domain: typeof p.domain === "string" && p.domain.trim() ? p.domain.trim().toLowerCase() : null,
      rationale: typeof p.rationale === "string" ? p.rationale.trim() : "",
    };
  });
}

/** Common pattern-guessed addresses for a person at a domain - unverified, needs human confirmation. */
export function guessEmailPatterns(name: string | null, domain: string | null): string[] {
  if (!domain) return [];
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!name) return [`info@${cleanDomain}`, `hello@${cleanDomain}`];

  const parts = name
    .toLowerCase()
    .replace(/[^a-z\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return [`info@${cleanDomain}`];

  const first = parts[0]!;
  const last = parts.length > 1 ? parts[parts.length - 1]! : "";

  const patterns = new Set<string>();
  if (first) patterns.add(`${first}@${cleanDomain}`);
  if (first && last) {
    patterns.add(`${first}.${last}@${cleanDomain}`);
    patterns.add(`${first[0]}${last}@${cleanDomain}`);
    patterns.add(`${first}${last}@${cleanDomain}`);
  }
  return Array.from(patterns).slice(0, 4);
}
