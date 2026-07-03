import { apiKeyUnauthorized, verifyApiKey } from "@/lib/api-key-auth";
import type { NextRequest } from "next/server";

export function verifyNewsletterMcpKey(request: NextRequest): boolean {
  return (
    verifyApiKey(request, "NEWSLETTER_MCP_API_KEY") ||
    verifyApiKey(request, "NEWS_PUBLISH_API_KEY")
  );
}

export function newsletterMcpUnauthorized() {
  return apiKeyUnauthorized();
}