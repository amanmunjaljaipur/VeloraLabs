import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { getConnectedAccount } from "@/lib/marketing/accounts-store";
import { listMarketingPosts, type MarketingPost } from "@/lib/marketing/posts-store";
import { getFacebookPostInsights, getInstagramMediaInsights } from "@/lib/marketing/meta-client";
import { getLinkedInPostAnalytics } from "@/lib/marketing/linkedin-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface PerformanceTarget {
  platform: string;
  status: string;
  analytics: Record<string, number> | null;
}

interface PerformanceRow {
  post: MarketingPost;
  targets: PerformanceTarget[];
}

/**
 * Unified "how is each post doing" view. Every published target is looked
 * up against its own platform's analytics endpoint - a failure on one
 * target (expired token, metric not available yet) shows as null for that
 * row instead of breaking the whole table.
 */
export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await listMarketingPosts();

  const rows: PerformanceRow[] = await Promise.all(
    posts.map(async (post) => {
      const targets: PerformanceTarget[] = await Promise.all(
        post.targets.map(async (target) => {
          if (target.status !== "published" || !target.platformPostId) {
            return { platform: target.platform, status: target.status, analytics: null };
          }

          const account = await getConnectedAccount(target.accountId);
          if (!account) return { platform: target.platform, status: target.status, analytics: null };

          let analytics: Record<string, number> | null = null;
          try {
            if (target.platform === "facebook") {
              analytics = await getFacebookPostInsights(target.platformPostId, account.accessToken);
            } else if (target.platform === "instagram") {
              analytics = await getInstagramMediaInsights(target.platformPostId, account.accessToken);
            } else if (target.platform === "linkedin") {
              analytics = await getLinkedInPostAnalytics(
                target.platformPostId,
                account.externalId,
                account.accessToken
              );
            }
          } catch {
            analytics = null;
          }

          return { platform: target.platform, status: target.status, analytics };
        })
      );

      return { post, targets };
    })
  );

  return NextResponse.json({ rows });
}
