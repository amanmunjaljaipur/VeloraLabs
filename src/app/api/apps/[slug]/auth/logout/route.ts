import { logoutAppUser } from "@/lib/app-builder/app-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(_request: Request, context: Ctx) {
  const { slug } = await context.params;
  await logoutAppUser(slug);
  return NextResponse.json({ ok: true });
}
