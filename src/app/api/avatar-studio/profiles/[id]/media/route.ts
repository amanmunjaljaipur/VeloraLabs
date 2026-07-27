import { auth } from "@/auth";
import {
  addMediaToProfile,
  buildMediaItem,
  getProfile,
} from "@/lib/avatar-studio/profiles-store";
import { hasCurrentConsent } from "@/lib/avatar-studio/consent-store";
import { uploadUserMedia } from "@/lib/avatar-studio/storage-adapter";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
const MAX_FILES = 12;
const MAX_BANK_SIZE = 24;

/**
 * POST — add more images/videos to an existing character's image bank.
 * FormData: files (multiple) or file (single), optional setAsCover=true
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const { id } = await params;

  const profile = await getProfile(id, email);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (profile.kind === "voice") {
    return NextResponse.json(
      { error: "Image bank is for face/character profiles. Create an avatar profile for photos." },
      { status: 400 }
    );
  }

  const consented = await hasCurrentConsent(email, "voice_face_clone");
  if (!consented) {
    return NextResponse.json({ error: "consent_required" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rate = checkRateLimit(`avatar-profile-media:${email}:${ip}`, 30, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many uploads, try later" }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const files: File[] = [];
  for (const entry of form.getAll("files")) {
    if (entry instanceof File && entry.size > 0) files.push(entry);
  }
  const single = form.get("file");
  if (files.length === 0 && single instanceof File && single.size > 0) files.push(single);
  if (files.length === 0) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Max ${MAX_FILES} files at once` }, { status: 400 });
  }
  if (profile.mediaBank.length + files.length > MAX_BANK_SIZE) {
    return NextResponse.json(
      { error: `Character image bank max is ${MAX_BANK_SIZE} items` },
      { status: 400 }
    );
  }

  const setAsCover = form.get("setAsCover") === "true" || form.get("setAsCover") === "1";
  let updated = profile;

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `File too large: ${file.name}` }, { status: 400 });
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only images or videos can be added to a character bank" },
        { status: 400 }
      );
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name?.trim() || `face-${Date.now()}.${file.type.split("/")[1] || "jpg"}`;
    const storageRef = await uploadUserMedia(email, safeName, bytes, file.type || "image/jpeg");
    const item = buildMediaItem({
      provider: storageRef.provider,
      url: storageRef.url,
      mimeType: file.type || "image/jpeg",
      label: file.name,
    });
    const next = await addMediaToProfile(id, email, item, {
      setAsCover: setAsCover && i === 0,
    });
    if (!next) return NextResponse.json({ error: "Failed to add media" }, { status: 500 });
    updated = next;
  }

  return NextResponse.json({
    profile: updated,
    added: files.length,
    imageCount: updated.mediaBank.filter((m) => m.kind === "image").length,
  });
}
