import { DefaultSession } from "next-auth";
import type { AuthProvider } from "@/lib/known-users";
import type { UserRole } from "@/types/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Role the user is currently acting as - drives every existing permission check. */
      role: UserRole | null;
      /** Full set of roles assigned to this user (for the role switcher / admin panel). */
      roles: UserRole[];
      rolePending: boolean;
      enrolledLearner: boolean;
      legalTermsVersion?: number;
      legalPrivacyVersion?: number;
      requiredLegalTermsVersion?: number;
      requiredLegalPrivacyVersion?: number;
      authProvider?: AuthProvider;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole | null;
    roles?: UserRole[];
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