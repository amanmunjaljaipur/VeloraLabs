import { createChatCompletion, isLlmConfigured } from "@/lib/chat/llm-client";
import { generateMarketingImage, isAiImageConfigured } from "@/lib/marketing/ai-image";
import { BRAND_NAME } from "@/lib/brand-email";

export { isLlmConfigured as isEmailTemplateAiConfigured };

/**
 * AI-generated email templates: one prompt produces a subject line and a
 * styled HTML body (inline CSS, since most inboxes strip <style> blocks),
 * optionally with an AI-generated header image via the same Pollinations
 * pipeline the social composer uses. Supports {{firstName}}/{{company}}
 * merge tags so a generated template works for both a single send and a
 * "send to all leads" campaign.
 */

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in AI response");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function generateEmailTemplate(input: {
  prompt: string;
  includeImage?: boolean;
  imageStyle?: string;
}): Promise<{ subject: string; html: string; imageUrl: string | null }> {
  const system = `You write cold-outreach and campaign email templates for ${BRAND_NAME}, an AI education/products company.
Given a request, respond with ONLY a JSON object:
{"subject": "<subject line, under 60 chars>", "body": "<email body as inline-styled HTML, using {{firstName}} and {{company}} merge tags where natural, no <html>/<head>/<body> wrapper, no <style> block - use inline style attributes only>"}
Keep the body concise (120-200 words), warm, and specific to the request. End with a clear single call to action.`;

  const { content } = await createChatCompletion({
    messages: [
      { role: "system", content: system },
      { role: "user", content: input.prompt },
    ],
    temperature: 0.6,
    maxTokens: 700,
  });

  const parsed = extractJson(content) as { subject?: string; body?: string };
  const subject = typeof parsed.subject === "string" && parsed.subject.trim() ? parsed.subject.trim() : "Following up";
  const body = typeof parsed.body === "string" && parsed.body.trim() ? parsed.body.trim() : "";

  let imageUrl: string | null = null;
  if (input.includeImage && isAiImageConfigured()) {
    const imagePrompt = input.imageStyle?.trim() || `Professional email header banner: ${input.prompt}`;
    const result = await generateMarketingImage(imagePrompt, { width: 1200, height: 400 });
    if (result.ok) imageUrl = result.url;
  }

  const imageBlock = imageUrl
    ? `<img src="${imageUrl}" alt="" style="width:100%;max-width:600px;height:auto;border-radius:8px;margin-bottom:16px;display:block" />`
    : "";

  const html = `${imageBlock}<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">${body}</div>`;

  return { subject, html, imageUrl };
}

/** AI-drafted single cold-outreach email body, optionally personalized to a specific prospect. */
export async function generateColdEmail(input: {
  prompt: string;
  prospectName?: string | null;
  prospectCompany?: string | null;
  prospectTitle?: string | null;
}): Promise<{ subject: string; html: string }> {
  const context = [
    input.prospectName ? `Recipient name: ${input.prospectName}` : null,
    input.prospectTitle ? `Recipient title: ${input.prospectTitle}` : null,
    input.prospectCompany ? `Recipient company: ${input.prospectCompany}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const system = `You write short, personalized cold outreach emails for ${BRAND_NAME}. Respond with ONLY JSON:
{"subject": "<subject line, under 60 chars>", "body": "<email body as inline-styled HTML, no <style> block, 80-140 words, one clear CTA>"}
Sound like a real person, not a marketing blast. No hype, no exclamation marks, no "I hope this email finds you well."`;

  const { content } = await createChatCompletion({
    messages: [
      { role: "system", content: system },
      { role: "user", content: `${context ? `${context}\n\n` : ""}Goal: ${input.prompt}` },
    ],
    temperature: 0.65,
    maxTokens: 500,
  });

  const parsed = extractJson(content) as { subject?: string; body?: string };
  const subject = typeof parsed.subject === "string" && parsed.subject.trim() ? parsed.subject.trim() : "Quick question";
  const body = typeof parsed.body === "string" && parsed.body.trim() ? parsed.body.trim() : "";

  return {
    subject,
    html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">${body}</div>`,
  };
}
