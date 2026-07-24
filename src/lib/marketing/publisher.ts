import { getConnectedAccount } from "@/lib/marketing/accounts-store";
import type { PostTarget } from "@/lib/marketing/posts-store";
import { postToFacebookPage, postToInstagram, postVideoToFacebookPage } from "@/lib/marketing/meta-client";
import { postToLinkedInOrganization } from "@/lib/marketing/linkedin-client";
import { getValidXAccessToken, postToX } from "@/lib/marketing/x-client";

/**
 * The one place that knows how to publish a piece of content to a list of
 * connected accounts. Shared by the immediate-publish API route and the
 * scheduler cron so "post now" and "post at 9am tomorrow" can never drift
 * apart in behavior. Each target is attempted independently - one
 * platform's failure (expired token, missing image for Instagram, rate
 * limit) never blocks the others.
 */
/** Uploaded media can be video - platforms differ wildly in what "post a video by URL" takes. */
function isVideoUrl(url: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(url);
}

export async function publishToAccounts(
  accountIds: string[],
  content: string,
  imageUrl: string | null
): Promise<PostTarget[]> {
  const targets: PostTarget[] = [];
  const video = isVideoUrl(imageUrl);

  for (const accountId of accountIds) {
    const account = await getConnectedAccount(accountId);
    if (!account) {
      targets.push({
        accountId,
        platform: "facebook",
        status: "failed",
        platformPostId: null,
        error: "Account not found",
      });
      continue;
    }

    if (account.platform === "facebook") {
      const result = video
        ? await postVideoToFacebookPage(account.externalId, account.accessToken, content, imageUrl as string)
        : await postToFacebookPage(account.externalId, account.accessToken, content, imageUrl ?? undefined);
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
      if (video) {
        targets.push({
          accountId,
          platform: "instagram",
          status: "failed",
          platformPostId: null,
          error: "Instagram video/Reels publishing is not wired yet - use an image for now",
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
    } else if (account.platform === "x") {
      const accessToken = await getValidXAccessToken(account);
      if (!accessToken) {
        targets.push({
          accountId,
          platform: "x",
          status: "failed",
          platformPostId: null,
          error: "X token expired and could not be refreshed - reconnect X",
        });
        continue;
      }
      const result = await postToX(accessToken, content);
      targets.push({
        accountId,
        platform: "x",
        status: result.ok ? "published" : "failed",
        platformPostId: result.ok ? result.postId : null,
        error: result.ok ? undefined : result.error,
      });
    }
  }

  return targets;
}
