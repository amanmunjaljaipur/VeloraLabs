import { requireAppCapability } from "@/lib/app-builder/app-auth";
import {
  getTenant,
  saveTenant,
  upsertCrmContact,
} from "@/lib/app-builder/tenant-store";
import type { AppCrmStage } from "@/lib/app-builder/tenant-types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "customers.view")) ||
    (await requireAppCapability(slug, "customers.manage")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenant = await getTenant(slug);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contacts = [...(tenant.crmContacts || [])].sort((a, b) =>
    b.lastActivityAt.localeCompare(a.lastActivityAt)
  );

  const stats = {
    total: contacts.length,
    new: contacts.filter((c) => c.stage === "new").length,
    customers: contacts.filter((c) => c.stage === "customer").length,
    orders: tenant.orders.length,
    inquiries: tenant.inquiries.length,
  };

  return NextResponse.json({ contacts, stats });
}

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "customers.manage")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { name?: string; email?: string; phone?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.email?.trim() || !body.name?.trim()) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  const contact = await upsertCrmContact(slug, {
    email: body.email,
    name: body.name,
    phone: body.phone,
    notes: body.notes,
    source: "manual",
    stage: "new",
  });

  return NextResponse.json({ contact }, { status: 201 });
}

export async function PATCH(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "customers.manage")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    id?: string;
    stage?: AppCrmStage;
    notes?: string;
    name?: string;
    phone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const tenant = await getTenant(slug);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!Array.isArray(tenant.crmContacts)) tenant.crmContacts = [];

  const contact = tenant.crmContacts.find((c) => c.id === body.id);
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  if (body.stage) contact.stage = body.stage;
  if (body.notes !== undefined) contact.notes = body.notes;
  if (body.name?.trim()) contact.name = body.name.trim();
  if (body.phone !== undefined) contact.phone = body.phone;
  contact.lastActivityAt = new Date().toISOString();

  await saveTenant(tenant);
  return NextResponse.json({ contact });
}
