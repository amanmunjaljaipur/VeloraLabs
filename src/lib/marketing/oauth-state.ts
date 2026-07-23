import { randomUUID } from "crypto";
import { cookies } from "next/headers";

/**
 * CSRF protection for the marketing-connect OAuth flows: a random state
 * value is generated, stored in a short-lived httpOnly cookie, and passed
 * through the OAuth `state` param. The callback rejects the exchange
 * unless the returned state matches the cookie - the same pattern OAuth
 * providers themselves use, applied here since we are the client
 * initiating the flow against Meta/LinkedIn rather than the provider.
 */

function cookieName(provider: string): string {
  return `marketing_oauth_state_${provider}`;
}

export async function issueOAuthState(provider: string): Promise<string> {
  const state = randomUUID();
  const store = await cookies();
  store.set(cookieName(provider), state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 10 * 60, // 10 minutes - plenty for a redirect round trip
    path: "/",
  });
  return state;
}

export async function verifyAndConsumeOAuthState(provider: string, returnedState: string | null): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(cookieName(provider))?.value;
  store.delete(cookieName(provider));
  return Boolean(expected && returnedState && expected === returnedState);
}
