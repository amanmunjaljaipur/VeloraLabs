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
import { ensureNewsletterSubscriber } from "@/lib/newsletter-subscribers";
import { DEFAULT_ROLE } from "@/types/roles";

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

const canonicalUrl =
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.NODE_ENV === "production" ? "https://www.verlinlabs.com" : "http://localhost:3000");

export const authOptions: NextAuthConfig = {
  secret: authSecret,
  basePath: "/api/auth",
  trustHost: true,
  ...(canonicalUrl ? { url: canonicalUrl } : {}),
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
        await ensureNewsletterSubscriber(identity.email, "Signed-in user");
      } catch (error) {
        console.error("Failed to record known user after sign-in:", error);
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      try {
        const isAuthSignIn =
          trigger === "signIn" || trigger === "signUp" || Boolean(account);

        await ensureRolesLoaded(isAuthSignIn);

        if (isAuthSignIn) {
          const identity = resolveSignInEmail(user, token, profile as { email?: string });
          if (identity) {
            try {
              await recordKnownUser(
                identity.email,
                identity.name,
                resolveAuthProvider(account?.provider)
              );
              await ensureNewsletterSubscriber(identity.email, "Signed-in user");
            } catch (error) {
              console.error("Failed to record known user in JWT callback:", error);
            }
            token.authProvider = resolveAuthProvider(account?.provider);
          }
        }

        const email = user?.email ?? token.email;
        if (email) {
          const role = getRoleForEmail(email);
          token.role = role;
          token.enrolledLearner = isEnrolledLearner(email, role);
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
          try {
            await ensureNewsletterSubscriber(session.user.email, "Signed-in user");
          } catch (error) {
            console.error("Failed to ensure newsletter subscriber:", error);
          }

          const role = getRoleForEmail(session.user.email) ?? DEFAULT_ROLE;
          session.user.role = role;
          session.user.enrolledLearner =
            token.enrolledLearner === true ||
            isEnrolledLearner(session.user.email, role);
        }
      } catch (error) {
        console.error("Session callback error:", error);
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);