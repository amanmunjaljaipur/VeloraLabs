import { getConnectedAccount } from "@/lib/marketing/accounts-store";
import type { PostTarget } from "@/lib/marketing/posts-store";
import {
  postCarouselToFacebookPage,
  postCarouselToInstagram,
  postToFacebookPage,
  postToInstagram,
  postVideoToFacebookPage,
} from "@/lib/marketing/meta-client";
import { postDocumentToLinkedInOrganization, postToLinkedInOrganization } from "@/lib/marketing/linkedin-client";
import { getValidXAccessToken, postToX } from "@/lib/marketing/x-client";
import { buildSlideDeckPdf, type SlideInput } from "@/lib/marketing/slide-deck";

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
  tenantId: string,
  accountIds: string[],
  content: string,
  imageUrl: string | null,
  extra?: { imageUrls?: string[]; slides?: SlideInput[] }
): Promise<PostTarget[]> {
  const targets: PostTarget[] = [];
  const video = isVideoUrl(imageUrl);
  const carouselUrls = extra?.imageUrls?.filter(Boolean) ?? [];
  const isCarousel = carouselUrls.length >= 2;
  const slides = extra?.slides?.filter((s) => s.heading?.trim()) ?? [];
  const isDocumentPost = slides.length >= 2;

  for (const accountId of accountIds) {
    const account = await getConnectedAccount(accountId, tenantId);
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
      const result = isCarousel
        ? await postCarouselToFacebookPage(account.externalId, account.accessToken, content, carouselUrls)
        : video
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
      if (isCarousel) {
        const result = await postCarouselToInstagram(account.externalId, account.accessToken, content, carouselUrls);
        targets.push({
          accountId,
          platform: "instagram",
          status: result.ok ? "published" : "failed",
          platformPostId: result.ok ? result.postId : null,
          error: result.ok ? undefined : result.error,
        });
        continue;
      }
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
      if (isDocumentPost) {
        try {
          const pdfBytes = await buildSlideDeckPdf({ slides, brandLabel: "Verlin Labs" });
          const result = await postDocumentToLinkedInOrganization(
            account.externalId,
            account.accessToken,
            content,
            pdfBytes,
            slides[0]?.heading ?? "Post"
          );
          targets.push({
            accountId,
            platform: "linkedin",
            status: result.ok ? "published" : "failed",
            platformPostId: result.ok ? result.postId : null,
            error: result.ok ? undefined : result.error,
          });
        } catch {
          targets.push({
            accountId,
            platform: "linkedin",
            status: "failed",
            platformPostId: null,
            error: "Could not build the slide-deck PDF",
          });
        }
        continue;
      }
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
          error: "X token expired and could not be refreshed — disconnect & reconnect X on Marketing Board",
        });
        continue;
      }
      // X video posting isn't wired up yet — post text only when media is video
      // so the rest of the publish (caption) still lands.
      const xImage = video ? null : imageUrl;
      // Prefer carousel cover for X (single image) when multi-image was selected
      const xImageResolved = xImage || (isCarousel ? carouselUrls[0] ?? null : null);
      const result = await postToX(accessToken, content, xImageResolved, {
        accountForRetry: {
          tenantId: account.tenantId,
          externalId: account.externalId,
          name: account.name,
          picture: account.picture,
          accessToken: account.accessToken,
          expiresAt: account.expiresAt,
          refreshToken: account.refreshToken,
          connectedBy: account.connectedBy,
        },
      });
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
