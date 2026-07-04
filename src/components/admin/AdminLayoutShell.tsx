"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/roles";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "verlin-admin-sidebar-collapsed";
const HIDDEN_PREFIXES = ["/login", "/signup"];

interface AdminLayoutShellProps {
  role: UserRole;
  children: React.ReactNode;
}

export function AdminLayoutShell({ role, children }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const sidebarHidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // ignore storage errors
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // ignore storage errors
    }
  }, [collapsed, ready]);

  return (
    <>
      <AdminSidebar
        role={role}
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <div
        className={cn(
          "min-w-0 flex-1 transition-[padding] duration-300 ease-in-out",
          !sidebarHidden && (collapsed ? "lg:pl-16" : "lg:pl-72")
        )}
      >
        {children}
      </div>
    </>
  );
}