import { requireCmsEditor } from "@/lib/cms/admin-auth";
import {
  listCmsUploads,
  listPublicImages,
  saveCmsUpload,
} from "@/lib/cms/store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const uploads = listCmsUploads().map((file) => ({
    path: `/api/cms/media/${encodeURIComponent(file)}`,
    label: file,
    source: "upload" as const,
  }));

  const library = listPublicImages().map((filePath) => ({
    path: filePath,
    label: filePath.replace("/images/", ""),
    source: "library" as const,
  }));

  return NextResponse.json({ images: [...uploads, ...library] });
}

export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are supported" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = saveCmsUpload(file.name, buffer);

  return NextResponse.json({
    ok: true,
    path,
    uploadedBy: session.user.email,
  });
}