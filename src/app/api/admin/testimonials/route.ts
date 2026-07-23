import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { listSubmissions, setSubmissionStatus } from "@/lib/testimonial-submissions";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** List all user-submitted testimonials, optionally filtered by ?status=pending|approved|rejected */
export async function GET(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status");
  const valid = status === "pending" || status === "approved" || status === "rejected";

  const submissions = await listSubmissions(valid ? status : undefined);
  return NextResponse.json({ submissions });
}

/** Approve or reject a submission. Body: { id, status: "approved" | "rejected" } */
export async function PATCH(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || (body.status !== "approved" && body.status !== "rejected")) {
    return NextResponse.json({ error: "id and status (approved|rejected) are required" }, { status: 400 });
  }

  const updated = await setSubmissionStatus(body.id, body.status, session.user?.email ?? "admin");
  if (!updated) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  return NextResponse.json({ submission: updated });
}
