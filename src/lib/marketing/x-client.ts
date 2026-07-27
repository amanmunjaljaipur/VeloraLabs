/**
 * Direct integration with X's (Twitter's) API v2 - no vendor in between.
 * Posts to and reads analytics from the Verlin Labs X account.
 *
 * X's OAuth 2.0 Authorization Code flow REQUIRES PKCE for every client,
 * confidential or not - that is the one meaningful difference from the
 * Meta/LinkedIn flows elsewhere in this folder, handled below with
 * createPkcePair() plus the code_verifier cookie helpers in oauth-state.ts.
 *
 * Setup required in X's own dashboard (outside this codebase):
 * 1. Create a project + app at developer.x.com (Free or Basic tier is
 *    enough for a single-account use case like this).
 * 2. Under the app's "User authentication settings": turn on OAuth 2.0,
 *    set App permissions to "Read and write", Type of App to
 *    "Web App, Automated App or Bot" (confidential client - it has a
 *    secret).
 * 3. Add a callback URI: https://www.verlinlabs.com/api/admin/marketing/connect/x/callback
 *    (and apex without www if you use that host).
 * 4. Generate a Client ID and Client Secret and set X_CLIENT_ID /
 *    X_CLIENT_SECRET in the environment.
 * 5. Log in to developer.x.com AS the @verlin.labs X account (or add it as
 *    a project collaborator) before running the Connect flow, since the
 *    account that completes the OAuth consent screen is the account these
 *    tokens post as.
 *
 * A note on access tokens: unlike Meta's Page tokens or LinkedIn's ~60-day
 * tokens, X's OAuth 2.0 access tokens expire in about 2 hours. The
 * `offline.access` scope requested below gets us a refresh_token so
 * getValidXAccessToken() can silently mint a new one instead of forcing a
 * manual reconnect every couple of hours.
 */

import { createHash, randomBytes } from "crypto";
import { upsertConnectedAccount } from "@/lib/marketing/accounts-store";
import { fetchMarketingMediaBytes } from "@/lib/marketing/media-fetch";
import { logError } from "@/lib/diagnostics/log-store";

/** Prefer api.x.com (current docs); twitter.com still aliases for many routes. */
const API_BASE = "https://api.x.com/2";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const FETCH_TIMEOUT_MS = 20_000;
const MEDIA_TIMEOUT_MS = 45_000;
/** Free-tier post length. Paid/Premium is higher; we fail clear if over. */
const X_FREE_CHAR_LIMIT = 280;

function isConfigured(): boolean {
  return Boolean(process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET);
}

export function isXConfigured(): boolean {
  return isConfigured();
}

/** PKCE pair for the authorize step - the verifier must be stashed (see oauth-state.ts) and replayed at token exchange. */
export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function buildXAuthUrl(state: string, redirectUri: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.X_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    scope: ["tweet.read", "tweet.write", "users.read", "offline.access", "media.write"].join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

function basicAuthHeader(): string {
  const raw = `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

interface TokenResult {
  accessToken: string;
  refreshToken: string | null;
  expiresInSeconds: number;
}

/** Unicode-aware length (matches how X counts most text better than string.length). */
export function xPostCharCount(text: string): number {
  return [...text].length;
}

export function validateXPostText(text: string): { ok: true; text: string } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Post text is empty" };
  const len = xPostCharCount(trimmed);
  if (len > X_FREE_CHAR_LIMIT) {
    return {
      ok: false,
      error: `X free posts max ${X_FREE_CHAR_LIMIT} characters (yours is ${len}). Shorten the text and try again.`,
    };
  }
  return { ok: true, text: trimmed };
}

function formatXApiError(status: number, data: unknown, fallback: string): string {
  const d = data as {
    detail?: string;
    title?: string;
    error?: string;
    error_description?: string;
    errors?: Array<{ message?: string; detail?: string; title?: string }>;
  } | null;

  const fromList = d?.errors?.[0]?.message || d?.errors?.[0]?.detail || d?.errors?.[0]?.title;
  const detail = d?.detail || fromList || d?.title || d?.error_description || d?.error;
  if (status === 401 || status === 403) {
    if (detail && /duplicate|already posted/i.test(detail)) {
      return `X rejected the post: ${detail}`;
    }
    if (detail && /rate.?limit|too many/i.test(detail)) {
      return `X rate limit hit: ${detail}`;
    }
    if (status === 401) {
      return detail
        ? `X auth failed (${detail}) — reconnect X on Marketing Board`
        : "X auth failed — reconnect X on Marketing Board";
    }
  }
  if (status === 429) {
    return "X rate limit — wait and try again (free tier is limited per day)";
  }
  return detail ? `X rejected the post: ${detail}` : fallback;
}

async function requestToken(body: URLSearchParams, logLabel: string): Promise<TokenResult | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(),
      },
      body,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[marketing/x] ${logLabel} failed`, res.status, errBody);
      void logError("marketing/x-token", `${logLabel} failed: ${res.status}`, {
        body: errBody.slice(0, 500),
      });
      return null;
    }
    const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresInSeconds: data.expires_in || 7200,
    };
  } catch (error) {
    console.error(`[marketing/x] ${logLabel} errored`, error);
    void logError("marketing/x-token", `${logLabel} errored`, { error: String(error) });
    return null;
  }
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<TokenResult | null> {
  // Confidential client: Basic auth is required. client_id in body is optional
  // but kept for compatibility with X's examples.
  return requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_id: process.env.X_CLIENT_ID as string,
    }),
    "token exchange"
  );
}

export async function refreshXAccessToken(refreshToken: string): Promise<TokenResult | null> {
  return requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.X_CLIENT_ID as string,
    }),
    "token refresh"
  );
}

/**
 * Given a stored account, returns an access token guaranteed valid for at
 * least another minute - refreshing and persisting a new one first if the
 * stored token is at or past its ~2 hour lifetime. Returns null if there is
 * no refresh token on file or the refresh itself fails, which callers
 * should treat as "needs reconnect".
 */
export async function getValidXAccessToken(account: {
  tenantId: string;
  externalId: string;
  name: string;
  picture?: string | null;
  accessToken: string;
  expiresAt: string | null;
  refreshToken?: string | null;
  connectedBy: string;
}): Promise<string | null> {
  // X access tokens last ~2h. Refresh 5 minutes early to avoid mid-publish expiry.
  const stillValid = !account.expiresAt || new Date(account.expiresAt).getTime() - Date.now() > 5 * 60_000;
  if (stillValid && account.accessToken) return account.accessToken;
  if (!account.refreshToken) {
    void logError("marketing/x-token", "X token expired with no refresh_token — reconnect required", {
      externalId: account.externalId,
    });
    return null;
  }

  const refreshed = await refreshXAccessToken(account.refreshToken);
  if (!refreshed) return null;

  await upsertConnectedAccount({
    tenantId: account.tenantId,
    platform: "x",
    externalId: account.externalId,
    name: account.name,
    picture: account.picture,
    accessToken: refreshed.accessToken,
    expiresAt: new Date(Date.now() + refreshed.expiresInSeconds * 1000).toISOString(),
    // X rotates refresh tokens — always persist the newest when provided
    refreshToken: refreshed.refreshToken ?? account.refreshToken,
    connectedBy: account.connectedBy,
  });

  return refreshed.accessToken;
}

/**
 * Force-refresh even if expiresAt says the token is still valid.
 * Used after a 401 from the tweets endpoint (clock skew / revoked token).
 */
export async function forceRefreshXAccessToken(account: {
  tenantId: string;
  externalId: string;
  name: string;
  picture?: string | null;
  accessToken: string;
  expiresAt: string | null;
  refreshToken?: string | null;
  connectedBy: string;
}): Promise<string | null> {
  if (!account.refreshToken) return null;
  const refreshed = await refreshXAccessToken(account.refreshToken);
  if (!refreshed) return null;
  await upsertConnectedAccount({
    tenantId: account.tenantId,
    platform: "x",
    externalId: account.externalId,
    name: account.name,
    picture: account.picture,
    accessToken: refreshed.accessToken,
    expiresAt: new Date(Date.now() + refreshed.expiresInSeconds * 1000).toISOString(),
    refreshToken: refreshed.refreshToken ?? account.refreshToken,
    connectedBy: account.connectedBy,
  });
  return refreshed.accessToken;
}

async function restFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[marketing/x] request failed: ${path} -> ${res.status} ${body}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error(`[marketing/x] request errored: ${path}`, error);
    return null;
  }
}

export interface DiscoveredXAccount {
  userId: string;
  username: string;
  name: string;
  picture: string | null;
}

/** X's OAuth grants access to exactly one account - the one that completed the consent screen, so this returns a single result, not a list. */
export async function discoverXAccount(accessToken: string): Promise<DiscoveredXAccount | null> {
  const data = await restFetch<{
    data?: { id: string; username: string; name: string; profile_image_url?: string };
  }>("/users/me?user.fields=profile_image_url", accessToken);
  if (!data?.data) return null;
  return {
    userId: data.data.id,
    username: data.data.username,
    name: data.data.name,
    picture: data.data.profile_image_url ?? null,
  };
}

/**
 * Upload an image for a tweet. Prefers one-shot POST /2/media/upload for images,
 * falls back to chunked initialize/append/finalize.
 * Requires media.write scope — reconnect X if connected before that scope existed.
 */
async function uploadMediaToX(
  accessToken: string,
  imageUrl: string
): Promise<{ ok: true; mediaId: string } | { ok: false; error: string }> {
  try {
    const loaded = await fetchMarketingMediaBytes(imageUrl);
    if ("error" in loaded) return { ok: false, error: loaded.error };

    const { bytes, contentType: rawType } = loaded;
    const contentType = rawType.startsWith("image/") ? rawType : "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return { ok: false, error: `Unsupported media type for X: ${contentType}` };
    }
    if (bytes.byteLength === 0) return { ok: false, error: "Image is empty" };
    if (bytes.byteLength > 5 * 1024 * 1024) {
      return { ok: false, error: "Image exceeds X's 5MB limit" };
    }

    // One-shot upload (images only) — simpler and more reliable on Free tier
    const oneShot = new FormData();
    oneShot.append("media", new Blob([new Uint8Array(bytes)], { type: contentType }), "image");
    oneShot.append("media_category", "tweet_image");
    oneShot.append("media_type", contentType);

    const oneShotRes = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: oneShot,
      signal: AbortSignal.timeout(MEDIA_TIMEOUT_MS),
    });
    const oneShotData = await oneShotRes.json().catch(() => null);
    const oneShotId: string | undefined =
      oneShotData?.data?.id || oneShotData?.media_id_string || oneShotData?.media_id?.toString();
    if (oneShotRes.ok && oneShotId) {
      return { ok: true, mediaId: String(oneShotId) };
    }
    console.warn("[marketing/x] one-shot media upload failed, trying chunked", oneShotRes.status, oneShotData);

    // Chunked fallback: INIT → APPEND → FINALIZE
    const initRes = await fetch(`${API_BASE}/media/upload/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: contentType,
        total_bytes: bytes.byteLength,
        media_category: "tweet_image",
      }),
      signal: AbortSignal.timeout(MEDIA_TIMEOUT_MS),
    });
    const initData = await initRes.json().catch(() => null);
    const mediaId: string | undefined = initData?.data?.id;
    if (!initRes.ok || !mediaId) {
      console.error("[marketing/x] media init failed", initRes.status, initData);
      return {
        ok: false,
        error:
          formatXApiError(initRes.status, initData, "X rejected the media upload (init)") +
          " — reconnect X if you connected before media permissions were enabled",
      };
    }

    const form = new FormData();
    form.append("segment_index", "0");
    form.append("media", new Blob([new Uint8Array(bytes)], { type: contentType }), "image");
    const appendRes = await fetch(`${API_BASE}/media/upload/${mediaId}/append`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
      signal: AbortSignal.timeout(MEDIA_TIMEOUT_MS),
    });
    if (!appendRes.ok) {
      const body = await appendRes.text().catch(() => "");
      console.error("[marketing/x] media append failed", appendRes.status, body);
      return { ok: false, error: "X rejected the media upload (append)" };
    }

    const finalizeRes = await fetch(`${API_BASE}/media/upload/${mediaId}/finalize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(MEDIA_TIMEOUT_MS),
    });
    const finalizeData = await finalizeRes.json().catch(() => null);
    if (!finalizeRes.ok) {
      console.error("[marketing/x] media finalize failed", finalizeRes.status, finalizeData);
      return {
        ok: false,
        error: formatXApiError(finalizeRes.status, finalizeData, "X rejected the media upload (finalize)"),
      };
    }

    return { ok: true, mediaId };
  } catch (error) {
    console.error("[marketing/x] media upload errored", error);
    void logError("marketing/x-media-upload", "Media upload threw", { error: String(error), imageUrl });
    return { ok: false, error: "Media upload to X failed" };
  }
}

async function createTweet(
  accessToken: string,
  text: string,
  mediaId: string | null
): Promise<{ ok: true; postId: string } | { ok: false; error: string; status?: number }> {
  const res = await fetch(`${API_BASE}/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(mediaId ? { text, media: { media_ids: [mediaId] } } : { text }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data?.id) {
    console.error("[marketing/x] post failed", res.status, data);
    void logError("marketing/x-post", `tweet create failed: ${res.status}`, {
      body: JSON.stringify(data)?.slice(0, 800),
    });
    return {
      ok: false,
      status: res.status,
      error: formatXApiError(res.status, data, "X did not accept the post"),
    };
  }
  return { ok: true, postId: data.data.id as string };
}

export async function postToX(
  accessToken: string,
  text: string,
  imageUrl?: string | null,
  options?: {
    /** When set, a 401 triggers one forced refresh + retry */
    accountForRetry?: {
      tenantId: string;
      externalId: string;
      name: string;
      picture?: string | null;
      accessToken: string;
      expiresAt: string | null;
      refreshToken?: string | null;
      connectedBy: string;
    };
  }
): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  try {
    const validated = validateXPostText(text);
    if (!validated.ok) return validated;

    let token = accessToken;
    let mediaId: string | null = null;
    let mediaWarning: string | null = null;

    if (imageUrl) {
      const media = await uploadMediaToX(token, imageUrl);
      if (media.ok) {
        mediaId = media.mediaId;
      } else {
        // Degrade to text-only rather than losing the whole post — but surface the reason
        mediaWarning = media.error;
        void logError("marketing/x-media-upload", media.error, { imageUrl });
      }
    }

    let result = await createTweet(token, validated.text, mediaId);

    // One forced refresh + retry on 401 (token revoked / skew / race after refresh)
    if (!result.ok && result.status === 401 && options?.accountForRetry?.refreshToken) {
      const fresh = await forceRefreshXAccessToken(options.accountForRetry);
      if (fresh) {
        token = fresh;
        // Re-upload media with fresh token if we had planned to attach one
        if (imageUrl && mediaId) {
          const media = await uploadMediaToX(token, imageUrl);
          mediaId = media.ok ? media.mediaId : null;
        }
        result = await createTweet(token, validated.text, mediaId);
      }
    }

    if (!result.ok) {
      const suffix = mediaWarning ? ` (image skipped: ${mediaWarning})` : "";
      return { ok: false, error: `${result.error}${suffix}` };
    }

    return { ok: true, postId: result.postId };
  } catch (error) {
    console.error("[marketing/x] post errored", error);
    void logError("marketing/x-post", "postToX threw", { error: String(error) });
    return { ok: false, error: "X request failed" };
  }
}

export async function getXPostAnalytics(tweetId: string, accessToken: string): Promise<Record<string, number> | null> {
  const data = await restFetch<{ data?: { public_metrics?: Record<string, number> } }>(
    `/tweets/${tweetId}?tweet.fields=public_metrics`,
    accessToken
  );
  const metrics = data?.data?.public_metrics;
  if (!metrics) return null;
  return {
    impressions: metrics.impression_count ?? 0,
    likes: metrics.like_count ?? 0,
    comments: metrics.reply_count ?? 0,
    shares: metrics.retweet_count ?? 0,
    quotes: metrics.quote_count ?? 0,
  };
}
