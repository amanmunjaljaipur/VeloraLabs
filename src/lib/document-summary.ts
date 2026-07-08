import { fetchPublicDocumentSnippet } from "@/lib/google-drive";

function fallbackSummary(title: string): string {
  return `Training resource: ${title}. Review this material to prepare for the session and reinforce key concepts afterward.`;
}

export async function generateDocumentSummary(input: {
  title: string;
  url: string;
}): Promise<{ summary: string; generatedBy: "ai" | "fallback" }> {
  const snippet = await fetchPublicDocumentSnippet(input.url);
  const apiKey = process.env.XAI_API_KEY?.trim();

  if (!apiKey) {
    if (snippet) {
      return { summary: snippet.slice(0, 280), generatedBy: "fallback" };
    }
    return { summary: fallbackSummary(input.title), generatedBy: "fallback" };
  }

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL ?? "grok-3-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Write one concise learner-facing sentence (max 220 characters) summarizing a training document. No markdown.",
          },
          {
            role: "user",
            content: `Title: ${input.title}\nURL: ${input.url}\nPublic snippet: ${snippet ?? "Unavailable"}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      throw new Error(`xAI failed: ${res.status}`);
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const summary = payload.choices?.[0]?.message?.content?.trim();
    if (summary) {
      return { summary: summary.slice(0, 280), generatedBy: "ai" };
    }
  } catch (error) {
    console.error("Document summary generation failed:", error);
  }

  if (snippet) {
    return { summary: snippet.slice(0, 280), generatedBy: "fallback" };
  }

  return { summary: fallbackSummary(input.title), generatedBy: "fallback" };
}