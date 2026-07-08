import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { signInSchema } from "@/lib/auth-validation";
import { isEnrolledLearner } from "@/lib/enrollment";
import {
  ensureKnownUser,
  ensureKnownUsersLoaded,
  recordKnownUser,
  type AuthProvider,
} from "@/lib/known-users";
import { ensureRolesLoaded, getRoleForEmail } from "@/lib/roles";
import { verifyManualUserPassword } from "@/lib/manual-users";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";

import {
  getLegalAcceptance,
  isLegalAcceptanceCurrent,
  type LegalVersionPair,
} from "@/lib/legal/acceptances";
import { getCurrentVersions } from "@/lib/legal/store";
import {
  LEGAL_ACCEPTANCE_COOKIE,
  parseLegalAcceptanceCookie,
} from "@/lib/legal/acceptance-cookie";
import { cookies } from "next/headers";



const THIRTY_DAYS = 30 * 24 * 60 * 60;
const ONE_DAY = 24 * 60 * 60;
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

class RateLimitedSignIn extends CredentialsSignin {
  code = "rate_limited";
}

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  throw new Error("AUTH_SECRET or NEXTAUTH_SECRET environment variable is required.");
}

function resolveAuthProvider(accountProvider?: string | null): AuthProvider {
  return accountProvider === "google" ? "google" : "credentials";
}

function resolveSignInEmail(
  user?: { email?: string | null; name?: string | null },
  token?: { email?: string | null; name?: string | null },
  profile?: { email?: string | null }
): { email: string; name: string | null } | null {
  const email = user?.email ?? token?.email ?? profile?.email;
  if (!email) return null;
  return {
    email,
    name: user?.name ?? token?.name ?? null,
  };
}

// OAuth redirect_uri must match a URI registered in Google Cloud Console.
// Production uses the Vercel URL (registered); middleware redirects callbacks to www.
const productionOAuthUrl = "https://velora-labs-gamma.vercel.app";

const canonicalUrl =
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.NODE_ENV === "production" ? productionOAuthUrl : "http://localhost:3000");

export const authOptions: NextAuthConfig = {
  secret: authSecret,
  basePath: "/api/auth",
  trustHost: true,

  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS,
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "text" },
      },
      async authorize(credentials, request) {
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
        if (!rateLimit.allowed) {
          throw new RateLimitedSignIn();
        }

        const parsed = signInSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
          remember: credentials?.remember === "true",
        });

        if (!parsed.success) {
          return null;
        }

        const user = await verifyManualUserPassword(parsed.data.email, parsed.data.password);
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          remember: parsed.data.remember ?? false,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  events: {
    async signIn({ user, account, profile }) {
      const identity = resolveSignInEmail(user, undefined, profile as { email?: string });
      if (!identity) return;

      try {
        await recordKnownUser(
          identity.email,
          identity.name,
          resolveAuthProvider(account?.provider)
        );
      } catch (error) {
        console.error("Failed to record known user after sign-in:", error);
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      try {
        const isAuthSignIn =
          trigger === "signIn" || trigger === "signUp" || Boolean(account);

        await ensureRolesLoaded(isAuthSignIn);

        if (trigger === "update" && session) {
          const patch = session as {
            legalTermsVersion?: number;
            legalPrivacyVersion?: number;
          };
          if (typeof patch.legalTermsVersion === "number") {
            token.legalTermsVersion = patch.legalTermsVersion;
          }
          if (typeof patch.legalPrivacyVersion === "number") {
            token.legalPrivacyVersion = patch.legalPrivacyVersion;
          }
        }

        if (isAuthSignIn) {
          const identity = resolveSignInEmail(user, token, profile as { email?: string });
          if (identity) {
            try {
              await recordKnownUser(
                identity.email,
                identity.name,
                resolveAuthProvider(account?.provider)
              );
            } catch (error) {
              console.error("Failed to record known user in JWT callback:", error);
            }
            token.authProvider = resolveAuthProvider(account?.provider);
          }
        }

        const email = user?.email ?? token.email;
        if (email) {
          const currentLegal = getCurrentVersions();
          const cookieStore = await cookies();
          const cookieAccepted = parseLegalAcceptanceCookie(
            cookieStore.get(LEGAL_ACCEPTANCE_COOKIE)?.value,
            email
          );
          const fileAccepted = getLegalAcceptance(email);
          const tokenTermsVersion =
            typeof token.legalTermsVersion === "number" ? token.legalTermsVersion : null;
          const tokenPrivacyVersion =
            typeof token.legalPrivacyVersion === "number" ? token.legalPrivacyVersion : null;
          const acceptedSources: Array<LegalVersionPair | null> = [
            cookieAccepted
              ? {
                  termsVersion: cookieAccepted.termsVersion,
                  privacyVersion: cookieAccepted.privacyVersion,
                }
              : null,
            fileAccepted
              ? {
                  termsVersion: fileAccepted.termsVersion,
                  privacyVersion: fileAccepted.privacyVersion,
                }
              : null,
            tokenTermsVersion != null && tokenPrivacyVersion != null
              ? {
                  termsVersion: tokenTermsVersion,
                  privacyVersion: tokenPrivacyVersion,
                }
              : null,
          ];

          const currentAcceptance = acceptedSources.find((source) =>
            isLegalAcceptanceCurrent(source, currentLegal)
          );

          if (currentAcceptance) {
            token.legalTermsVersion = currentAcceptance.termsVersion;
            token.legalPrivacyVersion = currentAcceptance.privacyVersion;
          } else if (tokenTermsVersion == null || tokenPrivacyVersion == null) {
            const fallback = cookieAccepted ?? fileAccepted;
            if (fallback) {
              token.legalTermsVersion = fallback.termsVersion;
              token.legalPrivacyVersion = fallback.privacyVersion;
            }
          }
        }

        if (email) {
          const role = getRoleForEmail(email);
          token.role = role;
          token.rolePending = role === null;
          token.enrolledLearner = isEnrolledLearner(email, role ?? undefined);
        }
        if (user?.id) {
          token.sub = user.id;
        }
        if (user && "remember" in user && user.remember) {
          token.maxAge = THIRTY_DAYS;
        } else if (user) {
          token.maxAge = ONE_DAY;
        }
      } catch (error) {
        console.error("JWT callback error:", error);
      }
      return token;
    },
    async session({ session, token }) {
      try {
        await ensureRolesLoaded();
        await ensureKnownUsersLoaded();

        if (session.user && token.sub) {
          session.user.id = token.sub;
        }
        if (session.user?.email) {
          await ensureKnownUser(
            session.user.email,
            session.user.name,
            token.authProvider as AuthProvider | undefined
          );
          const role = getRoleForEmail(session.user.email);
          session.user.role = role;
          session.user.rolePending = role === null;
          session.user.enrolledLearner =
            token.enrolledLearner === true ||
            isEnrolledLearner(session.user.email, role ?? undefined);

          const currentLegal = getCurrentVersions();
          session.user.requiredLegalTermsVersion = currentLegal.termsVersion;
          session.user.requiredLegalPrivacyVersion = currentLegal.privacyVersion;

          if (typeof token.legalTermsVersion === "number") {
            session.user.legalTermsVersion = token.legalTermsVersion;
          }
          if (typeof token.legalPrivacyVersion === "number") {
            session.user.legalPrivacyVersion = token.legalPrivacyVersion;
          }
        }
      } catch (error) {
        console.error("Session callback error:", error);
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);