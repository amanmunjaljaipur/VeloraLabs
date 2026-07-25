import { auth } from "@/auth";
import { listModels, type ModelKind } from "@/lib/avatar-studio/model-catalog";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kindParam = req.nextUrl.searchParams.get("kind");
  const kind = kindParam === "voice" || kindParam === "avatar" ? (kindParam as ModelKind) : undefined;

  const models = await listModels(kind);
  return NextResponse.json({ models });
}
