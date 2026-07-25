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
import { logError } from "@/lib/diagnostics/log-store";

const API_BASE = "https://api.twitter.com/2";
const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const FETCH_TIMEOUT_MS = 15_000;

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
      return null;
    }
    const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresInSeconds: data.expires_in,
    };
  } catch (error) {
    console.error(`[marketing/x] ${logLabel} errored`, error);
    return null;
  }
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<TokenResult | null> {
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
  const stillValid = !account.expiresAt || new Date(account.expiresAt).getTime() - Date.now() > 60_000;
  if (stillValid) return account.accessToken;
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
 * X's v2 chunked media upload: INIT -> APPEND -> FINALIZE. Images (our only
 * caller today) fit in a single APPEND segment since our images are always
 * well under X's own 5MB-per-image cap, which is also the max chunk size -
 * no need for multi-chunk logic until this grows to cover video. Requires
 * the media.write scope (added to buildXAuthUrl above) - an account
 * connected before this scope existed must reconnect once for this to work.
 */
async function uploadMediaToX(
  accessToken: string,
  imageUrl: string
): Promise<{ ok: true; mediaId: string } | { ok: false; error: string }> {
  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!imgRes.ok) return { ok: false, error: `Could not fetch image to upload (${imgRes.status})` };

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return { ok: false, error: `Unsupported media type for X: ${contentType}` };
    }

    const bytes = Buffer.from(await imgRes.arrayBuffer());
    if (bytes.byteLength === 0) return { ok: false, error: "Image is empty" };
    if (bytes.byteLength > 5 * 1024 * 1024) {
      return { ok: false, error: "Image exceeds X's 5MB limit" };
    }

    const initRes = await fetch(`${API_BASE}/media/upload/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: contentType,
        total_bytes: bytes.byteLength,
        media_category: "tweet_image",
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const initData = await initRes.json().catch(() => null);
    const mediaId: string | undefined = initData?.data?.id;
    if (!initRes.ok || !mediaId) {
      console.error("[marketing/x] media init failed", initRes.status, initData);
      return { ok: false, error: initData?.detail || initData?.title || "X rejected the media upload (init)" };
    }

    const form = new FormData();
    form.append("segment_index", "0");
    form.append("media", new Blob([bytes], { type: contentType }));
    const appendRes = await fetch(`${API_BASE}/media/upload/${mediaId}/append`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const finalizeData = await finalizeRes.json().catch(() => null);
    if (!finalizeRes.ok) {
      console.error("[marketing/x] media finalize failed", finalizeRes.status, finalizeData);
      return { ok: false, error: finalizeData?.detail || finalizeData?.title || "X rejected the media upload (finalize)" };
    }

    // Images finalize synchronously (no processing_info) - only video/GIF
    // need a poll loop, which this image-only path doesn't need yet.
    return { ok: true, mediaId };
  } catch (error) {
    console.error("[marketing/x] media upload errored", error);
    return { ok: false, error: "Media upload to X failed" };
  }
}

export async function postToX(
  accessToken: string,
  text: string,
  imageUrl?: string | null
): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  try {
    let mediaId: string | null = null;
    if (imageUrl) {
      const media = await uploadMediaToX(accessToken, imageUrl);
      if (media.ok) {
        mediaId = media.mediaId;
      } else {
        // Degrade to a text-only post rather than losing the whole post
        // over an image hiccup - but log it, since a silently-dropped image
        // is exactly the kind of thing that used to be invisible.
        void logError("marketing/x-media-upload", media.error, { imageUrl });
      }
    }

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
      const detail = data?.detail || data?.title;
      return { ok: false, error: detail ? `X rejected the post: ${detail}` : "X did not accept the post" };
    }
    return { ok: true, postId: data.data.id as string };
  } catch (error) {
    console.error("[marketing/x] post errored", error);
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
