import { apiKeyUnauthorized, verifyApiKey } from "@/lib/api-key-auth";
import { getWeekOfSunday } from "@/lib/news-week";
import { ingestNewsUpdates, listNewsUpdates } from "@/lib/news-updates";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const INGEST_LIMIT = 60;
const INGEST_WINDOW_MS = 15 * 60 * 1000;

const newsItemSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  url: z.string().url().optional(),
  source: z.string().optional(),
  category: z.string().optional(),
  weekOf: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const ingestSchema = z.union([
  newsItemSchema,
  z.object({
    items: z.array(newsItemSchema).min(1).max(25),
  }),
]);

function requireIngestAuth(request: NextRequest): NextResponse | null {
  if (!verifyApiKey(request, "NEWS_INGEST_API_KEY")) {
    return apiKeyUnauthorized() as NextResponse;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const authError = requireIngestAuth(request);
  if (authError) return authError;

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`news-ingest:${ip}`, INGEST_LIMIT, INGEST_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSec ?? 60) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = ingestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const items =
      "items" in parsed.data
        ? parsed.data.items
        : [parsed.data];

    const created = await ingestNewsUpdates(items);

    return NextResponse.json({
      success: true,
      count: created.length,
      weekOf: created[0]?.weekOf ?? getWeekOfSunday(),
      items: created.map((item) => ({
        id: item.id,
        title: item.title,
        weekOf: item.weekOf,
        status: item.status,
      })),
    });
  } catch (error) {
    console.error("News ingest failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authError = requireIngestAuth(request);
  if (authError) return authError;

  const weekOf = request.nextUrl.searchParams.get("weekOf") ?? undefined;
  const statusParam = request.nextUrl.searchParams.get("status");
  const status =
    statusParam === "pending" || statusParam === "published" ? statusParam : undefined;

  const items = await listNewsUpdates({ weekOf, status });

  return NextResponse.json({
    success: true,
    count: items.length,
    items,
  });
}