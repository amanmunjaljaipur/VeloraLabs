import { requireCmsEditor } from "@/lib/cms/admin-auth";
import {
  createManagedSlot,
  deleteManagedSlot,
  listManagedSlots,
  SLOT_CATEGORIES,
  updateManagedSlot,
  type SlotCategory,
} from "@/lib/booking/slots-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_CATEGORIES = new Set(SLOT_CATEGORIES.map((c) => c.value));

function isSlotCategory(value: unknown): value is SlotCategory {
  return typeof value === "string" && VALID_CATEGORIES.has(value as SlotCategory);
}

/** List every super-admin-managed session slot, grouped by audience category. */
export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const slots = await listManagedSlots();
  return NextResponse.json({ categories: SLOT_CATEGORIES, slots });
}

/** Create a new time slot for a category (Free Session / Students / Engineers / Professionals). */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || !isSlotCategory(body.category) || typeof body.time !== "string") {
    return NextResponse.json({ error: "category and time are required" }, { status: 400 });
  }
  const capacity = Number(body.capacity);

  const result = await createManagedSlot({
    category: body.category,
    time: body.time,
    capacity,
    createdBy: session.user?.email ?? undefined,
  });

  if (!result.ok) {
    const messages: Record<string, string> = {
      invalid_time: "Time must be in 24h HH:mm format",
      invalid_capacity: "Capacity must be a number between 1 and 500",
      duplicate: "A slot already exists at this time for this category",
    };
    return NextResponse.json({ error: messages[result.error] }, { status: 400 });
  }

  return NextResponse.json({ slot: result.slot }, { status: 201 });
}

/** Update a slot's time or capacity. Body: { id, time?, capacity? } */
export async function PATCH(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const result = await updateManagedSlot(body.id, {
    time: typeof body.time === "string" ? body.time : undefined,
    capacity: body.capacity !== undefined ? Number(body.capacity) : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Could not update slot" }, { status: 400 });
  }
  return NextResponse.json({ slot: result.slot });
}

/** Delete a slot: DELETE /api/admin/slots?id=... */
export async function DELETE(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const deleted = await deleteManagedSlot(id);
  if (!deleted) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
