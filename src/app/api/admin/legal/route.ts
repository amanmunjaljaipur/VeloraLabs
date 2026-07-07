import { requireLegalEditor } from "@/lib/legal/admin-auth";
import { readLegalCms, updateLegalDocument } from "@/lib/legal/store";
import type { LegalDocType, LegalSection } from "@/lib/legal/types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const sectionSchema = z.object({
  id: z.string().min(1),
  heading: z.string().min(1).max(200),
  content: z.string().min(1).max(20000),
});

const updateSchema = z.object({
  type: z.enum(["terms", "privacy", "refund"]),
  disclaimer: z.string().max(2000),
  sections: z.array(sectionSchema).min(1),
});

export async function GET() {
  const session = await requireLegalEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(readLegalCms());
}

export async function PUT(req: NextRequest) {
  const session = await requireLegalEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = updateSchema.parse(await req.json()) as {
      type: LegalDocType;
      disclaimer: string;
      sections: LegalSection[];
    };

    const updated = updateLegalDocument(
      body.type,
      { disclaimer: body.disclaimer, sections: body.sections },
      session.user.email ?? undefined
    );

    return NextResponse.json({ document: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}