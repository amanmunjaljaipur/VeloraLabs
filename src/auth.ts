import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getRoleForEmail } from "@/lib/roles";
import { DEFAULT_ROLE } from "@/types/roles";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      const email = user?.email ?? token.email;
      if (email) {
        token.role = getRoleForEmail(email);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      if (session.user) {
        session.user.role = getRoleForEmail(session.user.email) ?? DEFAULT_ROLE;
      }
      return session;
    },
  },
});