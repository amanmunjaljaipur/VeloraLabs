import { DefaultSession } from "next-auth";
import type { AuthProvider } from "@/lib/known-users";
import type { UserRole } from "@/types/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      enrolledLearner: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    maxAge?: number;
    enrolledLearner?: boolean;
    authProvider?: AuthProvider;
  }
}

declare module "@auth/core/types" {
  interface User {
    remember?: boolean;
  }
}