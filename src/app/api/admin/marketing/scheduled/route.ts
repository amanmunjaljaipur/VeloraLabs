import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { cancelScheduledPost, listScheduledPosts } from "@/lib/marketing/scheduled-posts-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = await resolveTenantId(session.user?.email);
  const posts = await listScheduledPosts(tenantId);
  return NextResponse.json({ posts });
}

/** Cancel a scheduled post that has not been published yet: DELETE ?id=... */
export async function DELETE(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const tenantId = await resolveTenantId(session.user?.email);
  const removed = await cancelScheduledPost(id, tenantId);
  if (!removed) {
    return NextResponse.json({ error: "Not found or already published" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
