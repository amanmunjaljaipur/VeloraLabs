import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { buildTemplateExcel, buildTrainingExcel } from "@/lib/chat/training-excel";
import { readTrainingDataset } from "@/lib/chat/training-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const template = req.nextUrl.searchParams.get("template") === "1";
  const dataset = readTrainingDataset();
  const buffer = template
    ? buildTemplateExcel()
    : buildTrainingExcel(dataset.entries);

  const filename = template
    ? "verlin-chatbot-training-template.xlsx"
    : `verlin-chatbot-training-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}