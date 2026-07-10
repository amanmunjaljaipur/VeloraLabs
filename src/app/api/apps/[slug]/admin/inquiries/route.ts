import { requireAppCapability } from "@/lib/app-builder/app-auth";
import { addInquiry, getTenant, saveTenant } from "@/lib/app-builder/tenant-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "inquiries.manage")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ inquiries: authz.tenant.inquiries });
}

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  // Public can send inquiries
  let body: { name?: string; email?: string; phone?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
    return NextResponse.json({ error: "Name, email and message required" }, { status: 400 });
  }
  const tenant = await getTenant(slug);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inquiry = await addInquiry(slug, {
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone?.trim(),
    message: body.message.trim(),
  });
  return NextResponse.json({ inquiry }, { status: 201 });
}

export async function PATCH(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "inquiries.manage")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { id?: string; status?: "new" | "read" | "closed" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const tenant = await getTenant(slug);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = tenant.inquiries.find((i) => i.id === body.id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.status) row.status = body.status;
  await saveTenant(tenant);
  return NextResponse.json({ inquiry: row });
}
