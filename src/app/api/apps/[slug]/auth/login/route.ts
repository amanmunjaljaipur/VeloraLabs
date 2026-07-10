import { loginAppUser } from "@/lib/app-builder/app-auth";
import { clientIpFromRequest } from "@/lib/app-builder/security";
import { ensureTenantForProject, getTenant } from "@/lib/app-builder/tenant-store";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const ip = clientIpFromRequest(request);
  const rl = checkRateLimit(`app-login:${slug}:${ip}`, 15, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec || 60) } }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let tenant = await getTenant(slug);
  if (!tenant) {
    const project = await getAppProjectBySlug(slug);
    if (project?.status === "live") tenant = await ensureTenantForProject(project);
  }
  if (!tenant) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const result = await loginAppUser(slug, body.email || "", body.password || "");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  return NextResponse.json({ ok: true, email: result.memberEmail });
}
