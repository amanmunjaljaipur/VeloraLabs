import { requireAppCapability, resolveAppAccess } from "@/lib/app-builder/app-auth";
import { addOrder, getTenant, updateOrderStatus } from "@/lib/app-builder/tenant-store";
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
  const ctx = await resolveAppAccess(slug);
  // Guests can also place a simple order with contact details
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
  const name = body.customerName || ctx?.session.name || "Customer";
  if (!email || !body.items?.length) {
    return NextResponse.json({ error: "Email and at least one item required" }, { status: 400 });
  }

  const order = await addOrder(slug, {
    customerEmail: email,
    customerName: name,
    customerPhone: body.customerPhone,
    items: body.items,
    note: body.note,
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
  const order = await updateOrderStatus(slug, body.orderId, body.status);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}
