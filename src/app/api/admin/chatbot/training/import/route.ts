import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { parseTrainingExcel } from "@/lib/chat/training-excel";
import { importTrainingEntries } from "@/lib/chat/training-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const mode = form.get("mode") === "replace" ? "replace" : "merge";

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Excel file required" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const rows = parseTrainingExcel(buffer);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found. Check column headers match the template." },
      { status: 400 }
    );
  }

  const result = importTrainingEntries(rows, mode, session.user.email ?? undefined);
  return NextResponse.json(result);
}