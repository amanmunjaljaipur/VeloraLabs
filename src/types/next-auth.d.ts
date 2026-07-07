import { DefaultSession } from "next-auth";
import type { AuthProvider } from "@/lib/known-users";
import type { UserRole } from "@/types/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole | null;
      rolePending: boolean;
      enrolledLearner: boolean;
      legalTermsVersion?: number;
      legalPrivacyVersion?: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole | null;
    rolePending?: boolean;
    maxAge?: number;
    enrolledLearner?: boolean;
    authProvider?: AuthProvider;
    legalTermsVersion?: number;
    legalPrivacyVersion?: number;
  }
}

declare module "@auth/core/types" {
  interface User {
    remember?: boolean;
  }
}