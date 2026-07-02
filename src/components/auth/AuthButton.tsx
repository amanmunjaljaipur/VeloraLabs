"use client";

import { Button } from "@/components/ui/Button";
import { ROLE_LABELS } from "@/types/roles";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { LogIn, LogOut } from "lucide-react";

export function AuthButton({ className }: { className?: string }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className={`h-9 w-20 rounded-xl bg-muted animate-pulse ${className}`} />
    );
  }

  if (session?.user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || "User"}
            width={32}
            height={32}
            className="rounded-full border border-border"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/10 text-teal text-sm font-semibold">
            {session.user.name?.charAt(0) || "U"}
          </div>
        )}
        {session.user.role && (
          <span className="hidden md:inline text-xs font-medium text-text-secondary">
            {ROLE_LABELS[session.user.role]}
          </span>
        )}
        <button
          onClick={() => signOut()}
          className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <button
          onClick={() => signOut()}
          className="sm:hidden rounded-xl p-2 text-text-secondary hover:bg-muted"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      className={className}
      onClick={() => signIn("google")}
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Sign in</span>
    </Button>
  );
}