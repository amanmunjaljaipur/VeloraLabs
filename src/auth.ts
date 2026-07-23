import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import { signInSchema } from "@/lib/auth-validation";
import { isEnrolledLearner } from "@/lib/enrollment";
import {
  ensureKnownUser,
  ensureKnownUsersLoaded,
  recordKnownUser,
  type AuthProvider,
} from "@/lib/known-users";
import {
  ensureRolesLoaded,
  getRoleForEmail,
  getRoleForEmailFresh,
  isHardcodedSuperAdmin,
} from "@/lib/roles";
import { verifyManualUserPasswordDetailed } from "@/lib/manual-users";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAuthSecret } from "@/lib/auth-secret";
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

class EmailNotVerifiedSignIn extends CredentialsSignin {
  code = "email_not_verified";
}

const authSecret = resolveAuthSecret();

function resolveAuthProvider(accountProvider?: string | null): AuthProvider {
  if (accountProvider === "google") return "google";
  if (accountProvider === "linkedin") return "linkedin";
  return "credentials";
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
    // Only registered when credentials are configured, so the login/testimonial
    // pages can safely check for its presence without erroring in environments
    // (e.g. local dev) where a LinkedIn app has not been set up yet.
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
      ? [
          LinkedInProvider({
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          }),
        ]
      : []),
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

        const result = await verifyManualUserPasswordDetailed(
          parsed.data.email,
          parsed.data.password
        );

        if (result.status === "email_not_verified") {
          throw new EmailNotVerifiedSignIn();
        }

        if (result.status !== "ok") {
          return null;
        }

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
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

        // Always refresh roles from Blob so super_admin / admin promotions apply without waiting for cache
        await ensureRolesLoaded(true);

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
          // Hardcoded owners never wait on Blob - assign immediately
          const role = isHardcodedSuperAdmin(email)
            ? ("super_admin" as const)
            : getRoleForEmail(email);
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
        // Last resort: never leave platform owner without super_admin in the JWT
        const fallbackEmail =
          (typeof token.email === "string" && token.email) ||
          (user && typeof user.email === "string" ? user.email : null);
        if (fallbackEmail && isHardcodedSuperAdmin(fallbackEmail)) {
          token.role = "super_admin";
          token.rolePending = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      try {
        try {
          await ensureKnownUsersLoaded();
        } catch (e) {
          console.warn("[auth] ensureKnownUsersLoaded failed", e);
        }

        if (session.user && token.sub) {
          session.user.id = token.sub;
        }
        if (session.user && token.authProvider) {
          session.user.authProvider = token.authProvider as AuthProvider | undefined;
        }
        if (session.user?.email) {
          try {
            await ensureKnownUser(
              session.user.email,
              session.user.name,
              token.authProvider as AuthProvider | undefined
            );
          } catch (e) {
            console.warn("[auth] ensureKnownUser failed", e);
          }

          // Fresh role - hardcoded super_admin is sync-safe even if Blob is down
          let role = await getRoleForEmailFresh(session.user.email);
          if (!role && isHardcodedSuperAdmin(session.user.email)) {
            role = "super_admin";
          }
          // Prefer token if session I/O failed but JWT already has super_admin
          if (!role && token.role === "super_admin") {
            role = "super_admin";
          }
          session.user.role = role;
          session.user.rolePending = role === null;
          session.user.enrolledLearner =
            token.enrolledLearner === true ||
            isEnrolledLearner(session.user.email, role ?? undefined);

          try {
            const currentLegal = getCurrentVersions();
            session.user.requiredLegalTermsVersion = currentLegal.termsVersion;
            session.user.requiredLegalPrivacyVersion = currentLegal.privacyVersion;
          } catch {
            /* legal store optional for admin access */
          }

          if (typeof token.legalTermsVersion === "number") {
            session.user.legalTermsVersion = token.legalTermsVersion;
          }
          if (typeof token.legalPrivacyVersion === "number") {
            session.user.legalPrivacyVersion = token.legalPrivacyVersion;
          }
        }
      } catch (error) {
        console.error("Session callback error:", error);
        // Platform owner must never lose admin after a partial session failure
        if (session.user?.email && isHardcodedSuperAdmin(session.user.email)) {
          session.user.role = "super_admin";
          session.user.rolePending = false;
        } else if (token.role === "super_admin" && session.user) {
          session.user.role = "super_admin";
          session.user.rolePending = false;
        }
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);