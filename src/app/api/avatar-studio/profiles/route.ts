import { auth } from "@/auth";
import { listProfilesForUser, createProfile, type ProfileKind } from "@/lib/avatar-studio/profiles-store";
import { hasCurrentConsent } from "@/lib/avatar-studio/consent-store";
import { uploadUserMedia } from "@/lib/avatar-studio/storage-adapter";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const PROFILE_KINDS = new Set<ProfileKind>(["voice", "avatar", "both"]);
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB - generous for a source voice/video sample

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = await listProfilesForUser(session.user.email);
  return NextResponse.json({ profiles });
}

/**
 * Creates a "bring your own voice/face" clone profile from an uploaded
 * media sample. Hard-gated on the voice_face_clone consent (Section 5's
 * non-negotiable) - no upload is even accepted without it, let alone
 * processed. The actual embedding/cloning step happens later, off the
 * Voice/Avatar Agents once a real GPU endpoint is wired up; this route only
 * stores the source sample and creates the profile record in "processing".
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;

  const ip = getClientIp(req);
  const rate = checkRateLimit(`avatar-profile-create:${email}:${ip}`, 10, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many uploads, please try again later" }, { status: 429 });
  }

  const consented = await hasCurrentConsent(email, "voice_face_clone");
  if (!consented) {
    return NextResponse.json({ error: "consent_required", detail: "Voice/face cloning consent is required before uploading a sample" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  const name = typeof form.get("name") === "string" ? (form.get("name") as string).trim() : "";
  const kindRaw = form.get("kind");

  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!PROFILE_KINDS.has(kindRaw as ProfileKind)) return NextResponse.json({ error: "kind must be voice, avatar, or both" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File is too large (max 200MB)" }, { status: 400 });
  if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
    return NextResponse.json({ error: "File must be an audio or video sample" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storageRef = await uploadUserMedia(email, file.name, bytes, file.type);

  const profile = await createProfile({
    email,
    name,
    kind: kindRaw as ProfileKind,
    sourceMedia: { provider: storageRef.provider, url: storageRef.url },
  });

  return NextResponse.json({ profile }, { status: 201 });
}
