import { auth } from "@/auth";
import { listCategories } from "@/lib/avatar-studio/categories-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await listCategories();
  return NextResponse.json({ categories });
}
