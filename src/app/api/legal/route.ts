import { getPublicDocument } from "@/lib/legal/store";
import type { LegalDocType } from "@/lib/legal/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as LegalDocType | null;
  if (type === "terms" || type === "privacy" || type === "refund") {
    return NextResponse.json(getPublicDocument(type));
  }
  return NextResponse.json({
    terms: getPublicDocument("terms"),
    privacy: getPublicDocument("privacy"),
    refund: getPublicDocument("refund"),
  });
}