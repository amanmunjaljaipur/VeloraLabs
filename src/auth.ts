import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { signInSchema } from "@/lib/auth-validation";
import { isEnrolledLearner } from "@/lib/enrollment";
import { getRoleForEmail } from "@/lib/roles";
import { verifyManualUserPassword } from "@/lib/manual-users";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { DEFAULT_ROLE } from "@/types/roles";

const THIRTY_DAYS = 30 * 24 * 60 * 60;
const ONE_DAY = 24 * 60 * 60;
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

class RateLimitedSignIn extends CredentialsSignin {
  code = "rate_limited";
}

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET environment variable is required.");
}

export const authOptions: NextAuthConfig = {
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
  },
  callbacks: {
    jwt({ token, user }) {
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
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      if (session.user) {
        const role = getRoleForEmail(session.user.email) ?? DEFAULT_ROLE;
        session.user.role = role;
        session.user.enrolledLearner =
          token.enrolledLearner === true ||
          isEnrolledLearner(session.user.email, role);
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);