import { recordPageView } from "@/lib/analytics/page-views";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RATE = new Map<string, { count: number; resetAt: number }>();

function allow(ip: string): boolean {
  const now = Date.now();
  const entry = RATE.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 120) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const path = body.path?.trim();
  if (!path || path.length > 200) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  recordPageView(path, userAgent);
  return NextResponse.json({ ok: true });
}