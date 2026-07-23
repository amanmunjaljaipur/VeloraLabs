import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { getConnectedAccount } from "@/lib/marketing/accounts-store";
import { listMarketingPosts, recordMarketingPost, type PostTarget } from "@/lib/marketing/posts-store";
import { postToFacebookPage, postToInstagram } from "@/lib/marketing/meta-client";
import { postToLinkedInOrganization } from "@/lib/marketing/linkedin-client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await listMarketingPosts();
  return NextResponse.json({ posts });
}

/**
 * Publish to one or more connected accounts in a single call. Each target
 * platform is attempted independently and a failure on one (expired
 * token, rate limit, missing image for Instagram) never blocks the
 * others - the response reports per-target success/failure so the admin
 * sees exactly what went out and what did not.
 * Body: { content, imageUrl?, accountIds: string[] }
 */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const imageUrl = typeof body?.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null;
  const accountIds = Array.isArray(body?.accountIds)
    ? body.accountIds.filter((id: unknown) => typeof id === "string")
    : [];

  if (!content || content.length > 3000) {
    return NextResponse.json({ error: "Post content must be 1-3000 characters" }, { status: 400 });
  }
  if (accountIds.length === 0) {
    return NextResponse.json({ error: "Choose at least one connected account" }, { status: 400 });
  }

  const targets: PostTarget[] = [];

  for (const accountId of accountIds) {
    const account = await getConnectedAccount(accountId);
    if (!account) {
      targets.push({ accountId, platform: "facebook", status: "failed", platformPostId: null, error: "Account not found" });
      continue;
    }

    if (account.platform === "facebook") {
      const result = await postToFacebookPage(account.externalId, account.accessToken, content, imageUrl ?? undefined);
      targets.push({
        accountId,
        platform: "facebook",
        status: result.ok ? "published" : "failed",
        platformPostId: result.ok ? result.postId : null,
        error: result.ok ? undefined : result.error,
      });
    } else if (account.platform === "instagram") {
      if (!imageUrl) {
        targets.push({
          accountId,
          platform: "instagram",
          status: "failed",
          platformPostId: null,
          error: "Instagram requires an image",
        });
        continue;
      }
      const result = await postToInstagram(account.externalId, account.accessToken, content, imageUrl);
      targets.push({
        accountId,
        platform: "instagram",
        status: result.ok ? "published" : "failed",
        platformPostId: result.ok ? result.postId : null,
        error: result.ok ? undefined : result.error,
      });
    } else if (account.platform === "linkedin") {
      const result = await postToLinkedInOrganization(account.externalId, account.accessToken, content);
      targets.push({
        accountId,
        platform: "linkedin",
        status: result.ok ? "published" : "failed",
        platformPostId: result.ok ? result.postId : null,
        error: result.ok ? undefined : result.error,
      });
    }
  }

  const post = await recordMarketingPost({
    content,
    imageUrl,
    targets,
    createdBy: session.user?.email ?? "unknown",
  });

  const anyPublished = targets.some((t) => t.status === "published");
  return NextResponse.json({ post }, { status: anyPublished ? 201 : 502 });
}
