import { auth } from "@/auth";
import { getDriveConnection } from "@/lib/avatar-studio/storage-connections-store";
import { isGoogleDriveConfigured } from "@/lib/avatar-studio/google-drive-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connection = await getDriveConnection(session.user.email);
  return NextResponse.json({
    configured: isGoogleDriveConfigured(),
    connected: Boolean(connection),
    connectedAt: connection?.connectedAt ?? null,
  });
}
