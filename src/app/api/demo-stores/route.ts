import {
  getPublishedStore,
  listPublishedStores,
  upsertPublishedStore,
} from "@/lib/demo-stores/server-store";
import type { DemoStore } from "@/lib/demo-stores/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET ?id=ecom_1 → one store; bare → list published */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const store = await getPublishedStore(id);
      if (!store) {
        return NextResponse.json({ ok: false, error: "Store not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, store });
    }
    const stores = await listPublishedStores();
    return NextResponse.json({
      ok: true,
      stores: stores.map((s) => ({
        id: s.id,
        brandName: s.brandName,
        categoryId: s.categoryId,
        tagline: s.tagline,
        extension: s.extension,
        visits: s.visits,
      })),
    });
  } catch (e) {
    console.error("[demo-stores GET]", e);
    return NextResponse.json({ ok: false, error: "Failed to load stores" }, { status: 500 });
  }
}

/** POST body: { store: DemoStore } — publish / update */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { store?: DemoStore };
    const store = body.store;
    if (!store?.id || !store.brandName || !store.ownerEmail) {
      return NextResponse.json({ ok: false, error: "Invalid store payload" }, { status: 400 });
    }
    // Sanitize id
    if (!/^[a-z0-9][a-z0-9_-]{1,47}$/i.test(store.id)) {
      return NextResponse.json(
        { ok: false, error: "Store id must be alphanumeric (e.g. ecom-food_1)" },
        { status: 400 }
      );
    }
    const saved = await upsertPublishedStore({
      ...store,
      id: store.id.toLowerCase(),
      published: true,
    });
    return NextResponse.json({ ok: true, store: saved });
  } catch (e) {
    console.error("[demo-stores POST]", e);
    return NextResponse.json({ ok: false, error: "Failed to publish store" }, { status: 500 });
  }
}
