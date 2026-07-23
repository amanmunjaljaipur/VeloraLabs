/**
 * Direct integration with Meta's Graph API - no vendor in between. Handles
 * both Facebook (Pages API) and Instagram (Graph API for Business accounts)
 * since they share one Meta Developer App, one OAuth dialog, and one
 * underlying Graph API.
 *
 * Setup required in Meta's own dashboard (outside this codebase):
 * 1. Create a Meta Developer App at developers.facebook.com
 * 2. Add the "Facebook Login for Business" product
 * 3. Request these permissions: pages_show_list, pages_manage_posts,
 *    pages_read_engagement, instagram_basic, instagram_content_publish
 * 4. Since Verlin Labs only posts to its OWN Page/Instagram account (not
 *    third-party businesses), the app can run in Development Mode with the
 *    admin's account added as an App Role (Admin/Developer) under
 *    App Roles -> Roles - this skips the multi-week App Review wait for
 *    this specific single-company use case.
 * 5. Add an OAuth redirect URI: https://www.verlinlabs.com/api/admin/marketing/connect/meta/callback
 * 6. Set META_APP_ID and META_APP_SECRET in the environment.
 */

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const FETCH_TIMEOUT_MS = 15_000;

function isConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function isMetaConfigured(): boolean {
  return isConfigured();
}

export function buildMetaAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? "",
    redirect_uri: redirectUri,
    state,
    scope: [
      "pages_show_list",
      "pages_manage_posts",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_content_publish",
    ].join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

async function graphFetch<T>(path: string, params: Record<string, string> = {}, init?: RequestInit): Promise<T | null> {
  try {
    const url = new URL(`${GRAPH_BASE}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      ...init,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`[marketing/meta] Graph API error on ${path}:`, data?.error ?? data);
      return null;
    }
    return data as T;
  } catch (error) {
    console.error(`[marketing/meta] request failed: ${path}`, error);
    return null;
  }
}

/** Step 1 of connect: trade the OAuth code for a short-lived user access token. */
export async function exchangeCodeForUserToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string } | null> {
  if (!isConfigured()) return null;
  const data = await graphFetch<{ access_token: string }>("/oauth/access_token", {
    client_id: process.env.META_APP_ID as string,
    client_secret: process.env.META_APP_SECRET as string,
    redirect_uri: redirectUri,
    code,
  });
  return data ? { accessToken: data.access_token } : null;
}

/** Step 2: exchange the short-lived token for a long-lived one (~60 days) before deriving Page tokens. */
export async function getLongLivedUserToken(shortLivedToken: string): Promise<string | null> {
  if (!isConfigured()) return null;
  const data = await graphFetch<{ access_token: string }>("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID as string,
    client_secret: process.env.META_APP_SECRET as string,
    fb_exchange_token: shortLivedToken,
  });
  return data?.access_token ?? null;
}

export interface DiscoveredPage {
  pageId: string;
  pageName: string;
  pagePicture: string | null;
  /** Page access tokens derived from a long-lived user token do not expire on their own */
  pageAccessToken: string;
  instagramBusinessAccountId: string | null;
  instagramUsername: string | null;
}

/** Step 3: list every Page the connecting admin manages, with derived Page tokens and any linked IG Business Account. */
export async function discoverPages(longLivedUserToken: string): Promise<DiscoveredPage[]> {
  const data = await graphFetch<{
    data: Array<{
      id: string;
      name: string;
      access_token: string;
      picture?: { data?: { url?: string } };
      instagram_business_account?: { id: string };
    }>;
  }>(
    "/me/accounts",
    { fields: "id,name,access_token,picture,instagram_business_account", access_token: longLivedUserToken }
  );
  if (!data) return [];

  const pages: DiscoveredPage[] = [];
  for (const page of data.data) {
    let igUsername: string | null = null;
    if (page.instagram_business_account?.id) {
      const igProfile = await graphFetch<{ username?: string }>(`/${page.instagram_business_account.id}`, {
        fields: "username",
        access_token: page.access_token,
      });
      igUsername = igProfile?.username ?? null;
    }
    pages.push({
      pageId: page.id,
      pageName: page.name,
      pagePicture: page.picture?.data?.url ?? null,
      pageAccessToken: page.access_token,
      instagramBusinessAccountId: page.instagram_business_account?.id ?? null,
      instagramUsername: igUsername,
    });
  }
  return pages;
}

export async function postToFacebookPage(
  pageId: string,
  pageAccessToken: string,
  message: string,
  imageUrl?: string
): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  const path = imageUrl ? `/${pageId}/photos` : `/${pageId}/feed`;
  const params: Record<string, string> = imageUrl
    ? { url: imageUrl, caption: message }
    : { message };

  const data = await graphFetch<{ id?: string; post_id?: string }>(path, {
    ...params,
    access_token: pageAccessToken,
  }, { method: "POST" });

  if (!data) return { ok: false, error: "Facebook did not accept the post" };
  return { ok: true, postId: data.post_id ?? data.id ?? "" };
}

/** Instagram publishing is always two steps: create a media container, then publish it. */
export async function postToInstagram(
  igBusinessAccountId: string,
  pageAccessToken: string,
  caption: string,
  imageUrl: string
): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  if (!imageUrl) {
    return { ok: false, error: "Instagram requires an image - text-only posts are not supported" };
  }

  const container = await graphFetch<{ id: string }>(`/${igBusinessAccountId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: pageAccessToken,
  }, { method: "POST" });

  if (!container) return { ok: false, error: "Instagram rejected the image" };

  const published = await graphFetch<{ id: string }>(`/${igBusinessAccountId}/media_publish`, {
    creation_id: container.id,
    access_token: pageAccessToken,
  }, { method: "POST" });

  if (!published) return { ok: false, error: "Instagram accepted the image but publishing failed" };
  return { ok: true, postId: published.id };
}

export async function getFacebookPostInsights(
  postId: string,
  pageAccessToken: string
): Promise<Record<string, number> | null> {
  const data = await graphFetch<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>(
    `/${postId}/insights`,
    { metric: "post_impressions,post_engaged_users,post_clicks", access_token: pageAccessToken }
  );
  if (!data) return null;
  const result: Record<string, number> = {};
  for (const metric of data.data) {
    result[metric.name] = metric.values[0]?.value ?? 0;
  }
  return result;
}

export async function getInstagramMediaInsights(
  mediaId: string,
  pageAccessToken: string
): Promise<Record<string, number> | null> {
  const data = await graphFetch<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>(
    `/${mediaId}/insights`,
    { metric: "impressions,reach,likes,comments,shares", access_token: pageAccessToken }
  );
  if (!data) return null;
  const result: Record<string, number> = {};
  for (const metric of data.data) {
    result[metric.name] = metric.values[0]?.value ?? 0;
  }
  return result;
}
