/**
 * Lightweight AI assist for interactive apps (resume improve, bullet rewrite, etc.).
 * Uses server GROQ_API_KEY (or request key) — never logged.
 */

import { getDefaultGroqSecrets } from "@/lib/ai/default-groq";
import { listEnvSecrets } from "@/lib/app-studio/generate";
import { callUserLlm } from "@/lib/app-builder/llm";
import type { AppLlmSecrets, LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type AssistAction =
  | "improve_summary"
  | "improve_bullets"
  | "improve_headline"
  | "suggest_skills"
  | "general";

function secretsFromBody(body: {
  apiKey?: string;
  provider?: string;
  model?: string;
}): AppLlmSecrets[] {
  if (body.apiKey?.trim()) {
    const provider = (body.provider as LlmProviderKind) || "groq";
    return [
      {
        provider,
        apiKey: body.apiKey.trim(),
        model: body.model || "llama-3.3-70b-versatile",
      },
    ];
  }
  const list = listEnvSecrets();
  if (list.length) return list;
  return [getDefaultGroqSecrets()];
}

function systemFor(action: AssistAction): string {
  switch (action) {
    case "improve_summary":
      return `You rewrite resume professional summaries for Indian job seekers.
Return ONLY the improved summary paragraph (3-5 sentences). No markdown, no title. Quantify impact when possible.`;
    case "improve_bullets":
      return `You rewrite resume experience bullets. Return ONLY 3-6 bullets, each starting with "- ".
Use strong verbs and metrics. No intro text.`;
    case "improve_headline":
      return `You write a LinkedIn/resume headline under 120 characters. Return ONLY the headline text.`;
    case "suggest_skills":
      return `Given a target role, return 8-12 relevant skills as a comma-separated list only.`;
    default:
      return `You are a helpful product assistant. Be concise. Return plain text only.`;
  }
}

export async function POST(request: Request) {
  let body: {
    action?: AssistAction;
    text?: string;
    context?: string;
    apiKey?: string;
    provider?: string;
    model?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const text = (body.text || "").trim();
  const action = body.action || "general";
  if (!text && action !== "suggest_skills") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const list = secretsFromBody(body);
  if (!list.length) {
    return NextResponse.json(
      {
        error:
          "No AI key. Set GROQ_API_KEY on the server or pass apiKey in the request.",
      },
      { status: 503 }
    );
  }

  const user = [
    body.context ? `Context: ${body.context}` : "",
    text ? `Input:\n${text}` : "",
    "Return only the improved content.",
  ]
    .filter(Boolean)
    .join("\n\n");

  let lastErr = "";
  for (const secrets of list) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        let out: string;
        const base = (secrets.baseUrl || "").toLowerCase();
        if (base.includes("generativelanguage") || base.includes("gemini")) {
          const model = (secrets.model || "gemini-2.0-flash").replace(/^models\//, "");
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(secrets.apiKey)}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemFor(action) }] },
              contents: [{ role: "user", parts: [{ text: user }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
            }),
            signal: AbortSignal.timeout(45_000),
          });
          if (!res.ok) throw new Error(`Gemini ${res.status}`);
          const data = (await res.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          out =
            data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
            "";
        } else {
          out = await callUserLlm({
            secrets,
            temperature: 0.4,
            maxTokens: 800,
            timeoutMs: 45_000,
            messages: [
              { role: "system", content: systemFor(action) },
              { role: "user", content: user },
            ],
          });
        }
        out = out.trim();
        if (!out) throw new Error("Empty AI response");
        return NextResponse.json({
          text: out,
          action,
          provider: secrets.provider,
        });
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        if (/\b429\b|rate limit/i.test(lastErr) && attempt < 2) {
          await new Promise((r) => setTimeout(r, 8_000 * (attempt + 1)));
          continue;
        }
        break;
      }
    }
  }

  return NextResponse.json(
    { error: lastErr.slice(0, 200) || "AI assist failed" },
    { status: 502 }
  );
}
