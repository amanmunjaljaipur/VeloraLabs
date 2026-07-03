"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getAdminMenuLinks, isSuperAdminRole } from "@/lib/admin-nav";
import { ROLE_LABELS } from "@/types/roles";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LogOut, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function AuthButton({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const role = session?.user?.role;
  const adminLinks = getAdminMenuLinks(role);
  const isSuperAdmin = isSuperAdminRole(role);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (status === "loading") {
    return (
      <div className={cn("h-9 w-28 rounded-xl bg-muted animate-pulse", className)} />
    );
  }

  if (session?.user) {
    const displayName = session.user.name || session.user.email || "User";
    const navName =
      displayName.split(" ")[0]?.replace(/^\w/, (char) => char.toUpperCase()) || displayName;
    const roleLabel = role ? ROLE_LABELS[role] : null;

    return (
      <div ref={menuRef} className={cn("relative shrink-0", className)}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-xl border border-transparent px-2",
            "text-sm font-medium leading-none text-foreground transition-colors",
            "hover:border-border hover:bg-muted",
            open && "border-border bg-muted"
          )}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`${displayName} account menu`}
        >
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={displayName}
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal/10 text-xs font-semibold text-teal">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden max-w-[7rem] truncate sm:inline">{navName}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-text-secondary transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-[60] mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              {session.user.email && (
                <p className="mt-0.5 truncate text-xs text-text-secondary">{session.user.email}</p>
              )}
            </div>

            {roleLabel && (
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Role
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{roleLabel}</p>
              </div>
            )}

            {adminLinks.length > 0 && (
              <div className="border-b border-border py-1">
                <p className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
                  <Shield className="h-3.5 w-3.5" />
                  {isSuperAdmin ? "Super Admin" : "Admin"}
                </p>
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 transition-colors hover:bg-muted"
                  >
                    <span className="text-sm font-medium text-foreground">{link.label}</span>
                    {link.description && (
                      <span className="mt-0.5 block text-xs text-text-secondary">
                        {link.description}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {session.user.enrolledLearner && (
              <Link
                href="/my-course"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                My Course
              </Link>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-text-secondary transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link href="/login">
        <Button size="sm" variant="secondary" className="whitespace-nowrap">
          Sign in
        </Button>
      </Link>
      <Link href="/signup">
        <Button size="sm" className="whitespace-nowrap">
          Sign up
        </Button>
      </Link>
    </div>
  );
}