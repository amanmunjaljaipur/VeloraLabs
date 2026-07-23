/**
 * Direct integration with LinkedIn's Community Management API for posting
 * to and reading analytics from the Verlin Labs Company Page. This is a
 * SEPARATE LinkedIn app/credential pair from the one used for "Sign in
 * with LinkedIn" user login (src/auth.ts) - that one only requests
 * `openid profile email` for identifying a person; posting to a Company
 * Page needs `w_organization_social` (and `r_organization_social` to read
 * back analytics), which is a different, higher-trust permission that
 * LinkedIn reviews separately.
 *
 * Setup required in LinkedIn's own dashboard (outside this codebase):
 * 1. Create a LinkedIn Developer App at linkedin.com/developers, associated
 *    with a verified Company Page you administer.
 * 2. Request the "Community Management API" product.
 * 3. LinkedIn's review is two-tier: Development Tier first (usable
 *    immediately, but capped call volume - fine for getting this working),
 *    then apply for Standard Tier when ready for full production volume.
 *    Standard Tier requires a screencast demoing the actual use case.
 * 4. Add an OAuth redirect URL:
 *    https://www.verlinlabs.com/api/admin/marketing/connect/linkedin/callback
 * 5. Set LINKEDIN_ORG_CLIENT_ID and LINKEDIN_ORG_CLIENT_SECRET in the
 *    environment (deliberately separate names from LINKEDIN_CLIENT_ID /
 *    LINKEDIN_CLIENT_SECRET used by the login integration).
 *
 * A note on the endpoints below: LinkedIn versions its REST API by date via
 * the LinkedIn-Version header and has changed endpoint paths across
 * migrations (UGC API -> Posts API). The shapes here match LinkedIn's
 * documented Posts API as of this writing - confirm against
 * https://learn.microsoft.com/en-us/linkedin/marketing/community-management/
 * at connect time, since this is exactly the kind of dependency that drifts.
 */

const LINKEDIN_API_VERSION = "202506";
const REST_BASE = "https://api.linkedin.com/rest";
const FETCH_TIMEOUT_MS = 15_000;

function isConfigured(): boolean {
  return Boolean(process.env.LINKEDIN_ORG_CLIENT_ID && process.env.LINKEDIN_ORG_CLIENT_SECRET);
}

export function isLinkedInOrgConfigured(): boolean {
  return isConfigured();
}

export function buildLinkedInOrgAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_ORG_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    state,
    scope: ["w_organization_social", "r_organization_social", "rw_organization_admin"].join(" "),
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

async function restFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${REST_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[marketing/linkedin] request failed: ${path} -> ${res.status} ${body}`);
      return null;
    }
    if (res.status === 204) return {} as T;
    return (await res.json()) as T;
  } catch (error) {
    console.error(`[marketing/linkedin] request errored: ${path}`, error);
    return null;
  }
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresInSeconds: number } | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_ORG_CLIENT_ID as string,
        client_secret: process.env.LINKEDIN_ORG_CLIENT_SECRET as string,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; expires_in: number };
    return { accessToken: data.access_token, expiresInSeconds: data.expires_in };
  } catch (error) {
    console.error("[marketing/linkedin] token exchange failed", error);
    return null;
  }
}

export interface DiscoveredOrganization {
  organizationUrn: string;
  name: string;
  picture: string | null;
}

/** Which Company Page(s) the connecting admin administers - usually just Verlin Labs' own page. */
export async function discoverOrganizations(accessToken: string): Promise<DiscoveredOrganization[]> {
  const data = await restFetch<{
    elements: Array<{ organization: string }>;
  }>("/organizationAcls?q=roleAssignee", accessToken);
  if (!data?.elements?.length) return [];

  const orgs: DiscoveredOrganization[] = [];
  for (const el of data.elements) {
    const orgId = el.organization.split(":").pop();
    const orgData = await restFetch<{ localizedName?: string; logoV2?: { original?: string } }>(
      `/organizations/${orgId}`,
      accessToken
    );
    orgs.push({
      organizationUrn: el.organization,
      name: orgData?.localizedName ?? "LinkedIn Company Page",
      picture: orgData?.logoV2?.original ?? null,
    });
  }
  return orgs;
}

export async function postToLinkedInOrganization(
  organizationUrn: string,
  accessToken: string,
  commentary: string,
  imageUrn?: string
): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  const body: Record<string, unknown> = {
    author: organizationUrn,
    commentary,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: "PUBLISHED",
  };
  if (imageUrn) {
    body.content = { media: { id: imageUrn } };
  }

  try {
    const res = await fetch(`${REST_BASE}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const postId = res.headers.get("x-restli-id") ?? res.headers.get("x-linkedin-id");
    if (!res.ok || !postId) {
      const errBody = await res.text().catch(() => "");
      console.error("[marketing/linkedin] post failed", res.status, errBody);
      return { ok: false, error: "LinkedIn did not accept the post" };
    }
    return { ok: true, postId };
  } catch (error) {
    console.error("[marketing/linkedin] post errored", error);
    return { ok: false, error: "LinkedIn request failed" };
  }
}

export async function getLinkedInPostAnalytics(
  postUrn: string,
  organizationUrn: string,
  accessToken: string
): Promise<Record<string, number> | null> {
  const encoded = encodeURIComponent(postUrn);
  const data = await restFetch<{
    elements: Array<{ totalShareStatistics?: Record<string, number> }>;
  }>(
    `/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(
      organizationUrn
    )}&shares[0]=${encoded}`,
    accessToken
  );
  const stats = data?.elements?.[0]?.totalShareStatistics;
  return stats ?? null;
}
