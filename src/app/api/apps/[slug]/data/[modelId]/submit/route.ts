import { clientIpFromRequest } from "@/lib/app-builder/security";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import { createRecord } from "@/lib/app-builder/tenant-store";
import type { AppDataFieldSpec } from "@/lib/app-builder/types";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string; modelId: string }> };

/** Coerce a raw form value to the field's declared type; drop anything unsafe. */
function coerceField(field: AppDataFieldSpec, raw: unknown): unknown {
  const s = raw === undefined || raw === null ? "" : String(raw).slice(0, 2000);
  switch (field.type) {
    case "number":
    case "money":
      return s.trim() === "" ? null : Number(s);
    case "boolean":
      return s === "true" || s === "on" || s === "yes";
    case "email":
      return s.trim().slice(0, 200);
    case "phone":
      return s.replace(/[^\d+\s-]/g, "").slice(0, 32);
    default:
      return s;
  }
}

/**
 * Public, unauthenticated record creation for "intake" pages (apply, book,
 * get a quote, sign up, contact) on any Verlin Labs–built product. This is
 * what makes those pages functionally real for ANY product type instead of
 * a form that goes nowhere: submitting creates a genuine record, visible in
 * the product's admin dashboard (GenericDataAdmin).
 */
export async function POST(request: Request, context: Ctx) {
  const { slug, modelId } = await context.params;

  const ip = clientIpFromRequest(request);
  const rl = checkRateLimit(`app-data-submit:${slug}:${modelId}:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many submissions from this network. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec || 60) } }
    );
  }

  const project = await getAppProjectBySlug(slug);
  if (!project || project.status !== "live") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const model = project.dataModels?.find((m) => m.id === modelId);
  if (!model) {
    return NextResponse.json({ error: "Unknown form" }, { status: 404 });
  }

  let body: { fields?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const raw = body.fields && typeof body.fields === "object" ? body.fields : {};

  const missing = model.fields
    .filter((f) => f.required && f.type !== "relation")
    .filter((f) => {
      const v = raw[f.name];
      return v === undefined || v === null || String(v).trim() === "";
    })
    .map((f) => f.name);
  if (missing.length) {
    return NextResponse.json(
      { error: `Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const fields: Record<string, unknown> = {};
  for (const f of model.fields) {
    if (f.type === "relation") continue;
    if (raw[f.name] === undefined) continue;
    fields[f.name] = coerceField(f, raw[f.name]);
  }

  try {
    const record = await createRecord(slug, modelId, fields, "public");
    return NextResponse.json({ ok: true, record: { id: record.id } }, { status: 201 });
  } catch (e) {
    console.error("[apps/data/submit]", e);
    return NextResponse.json({ error: "Could not submit. Try again." }, { status: 500 });
  }
}
