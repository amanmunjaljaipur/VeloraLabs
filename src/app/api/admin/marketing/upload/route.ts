import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Direct-to-Blob client uploads for the Marketing Board composer, so
 * admins can attach their OWN media - images or video - instead of only
 * pasting URLs. The browser uploads straight to Vercel Blob with a signed
 * token from this route, which is what makes large video files possible
 * at all (serverless request bodies are capped at ~4.5MB, so proxying the
 * file through a normal API route would never fit a video).
 */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "video/mp4",
          "video/quicktime",
          "video/webm",
        ],
        maximumSizeInBytes: 200 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ pathname, uploadedBy: session.user?.email ?? "unknown" }),
      }),
      onUploadCompleted: async () => {
        // Nothing to persist - the composer holds the returned URL and the
        // post ledger records it on publish.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
