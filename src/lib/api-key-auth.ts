import type { NextRequest } from "next/server";

export function verifyApiKey(
  request: NextRequest,
  envVarName: "NEWS_INGEST_API_KEY" | "NEWS_PUBLISH_API_KEY" | "CRON_SECRET"
): boolean {
  const expected = process.env[envVarName];
  if (!expected) return false;

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7) === expected;
  }

  const apiKey = request.headers.get("x-api-key");
  return apiKey === expected;
}

export function apiKeyUnauthorized(): Response {
  return Response.json(
    { error: "Unauthorized — provide Authorization: Bearer <key> or x-api-key header" },
    { status: 401 }
  );
}