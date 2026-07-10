import { requireAppCapability, resolveAppAccess } from "@/lib/app-builder/app-auth";
import { clampOrderItems, clientIpFromRequest } from "@/lib/app-builder/security";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import { addOrder, getTenant, updateOrderStatus } from "@/lib/app-builder/tenant-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "orders.view")) ||
    (await requireAppCapability(slug, "orders.manage")) ||
    (await requireAppCapability(slug, "orders.own")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let orders = authz.tenant.orders;
  if (
    !authz.role.capabilities.includes("*") &&
    !authz.role.capabilities.includes("orders.view") &&
    !authz.role.capabilities.includes("orders.manage")
  ) {
    // customer: own only
    orders = orders.filter((o) => o.customerEmail === authz.session.email);
  }

  return NextResponse.json({ orders });
}

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const ip = clientIpFromRequest(request);
  const rl = checkRateLimit(`app-order:${slug}:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many orders from this network. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec || 60) } }
    );
  }

  const ctx = await resolveAppAccess(slug);
  let body: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    note?: string;
    items?: Array<{ productId: string; name: string; price: string; qty: number }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const tenant = await getTenant(slug);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const email = (body.customerEmail || ctx?.session.email || "").toLowerCase().trim();
  const name = String(body.customerName || ctx?.session.name || "Customer").slice(0, 80);
  if (!email.includes("@") || !body.items?.length) {
    return NextResponse.json({ error: "Email and at least one item required" }, { status: 400 });
  }

  // Prefer catalogue prices/names when product ids match (stop price spoofing)
  const project = await getAppProjectBySlug(slug);
  const catalogue =
    project?.content?.extensionId === "ecom-local-shop" ? project.content.products || [] : [];
  const byId = new Map(catalogue.map((p) => [p.id, p]));

  const raw = clampOrderItems(body.items);
  if (!raw.length) {
    return NextResponse.json({ error: "No valid items" }, { status: 400 });
  }

  const items = raw.map((it) => {
    const p = it.productId ? byId.get(it.productId) : undefined;
    if (p) {
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        qty: it.qty,
      };
    }
    // Unknown product id: keep clamped client fields but mark id
    return {
      productId: it.productId || "custom",
      name: it.name,
      price: it.price || "Ask",
      qty: it.qty,
    };
  });

  const order = await addOrder(slug, {
    customerEmail: email.slice(0, 120),
    customerName: name,
    customerPhone: body.customerPhone ? String(body.customerPhone).slice(0, 32) : undefined,
    items,
    note: body.note ? String(body.note).slice(0, 500) : undefined,
  });

  return NextResponse.json({ order }, { status: 201 });
}

export async function PATCH(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "orders.manage")) || (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { orderId?: string; status?: "new" | "confirmed" | "fulfilled" | "cancelled" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.orderId || !body.status) {
    return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
  }
  const allowed = new Set(["new", "confirmed", "fulfilled", "cancelled"]);
  if (!allowed.has(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const order = await updateOrderStatus(slug, body.orderId, body.status);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}
