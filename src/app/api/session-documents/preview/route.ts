import { auth } from "@/auth";
import { generateDocumentSummary } from "@/lib/document-summary";
import {
  buildGoogleDriveLearnerUrl,
  fetchGoogleDriveTitle,
  inferDocumentType,
  isGoogleDriveUrl,
} from "@/lib/google-drive";
import { isAdminRole } from "@/lib/session-access";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const previewSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { assertAgentActive } = await import("@/lib/agents/controls");
  const paused = await assertAgentActive("document-summary");
  if (paused) return NextResponse.json(paused, { status: 503 });

  try {
    const body = previewSchema.parse(await req.json());
    const adminUrl = body.url.trim();
    // SSRF guard: only Google Drive / Docs hosts for server-side fetch
    try {
      const host = new URL(adminUrl).hostname.toLowerCase();
      const allowed =
        host === "drive.google.com" ||
        host === "docs.google.com" ||
        host.endsWith(".googleusercontent.com");
      if (!allowed) {
        return NextResponse.json(
          { error: "Only Google Drive / Docs links can be previewed" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: "Valid document URL is required" }, { status: 400 });
    }
    const fetchedTitle = await fetchGoogleDriveTitle(adminUrl);
    const title = body.title?.trim() || fetchedTitle || "Training document";
    const learnerUrl = isGoogleDriveUrl(adminUrl)
      ? buildGoogleDriveLearnerUrl(adminUrl)
      : adminUrl;
    const type = isGoogleDriveUrl(adminUrl) ? inferDocumentType(adminUrl) : "link";
    const summaryResult = await generateDocumentSummary({ title, url: adminUrl });

    return NextResponse.json({
      title,
      adminUrl,
      learnerUrl,
      type,
      summary: summaryResult.summary,
      summaryGeneratedBy: summaryResult.generatedBy,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Valid document URL is required" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not preview document" }, { status: 500 });
  }
}