import { signupAppUser } from "@/lib/app-builder/app-auth";
import { ensureTenantForProject, getTenant } from "@/lib/app-builder/tenant-store";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  let body: { email?: string; password?: string; name?: string };
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

  const result = await signupAppUser(slug, {
    email: body.email || "",
    password: body.password || "",
    name: body.name || "",
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
