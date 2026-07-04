"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/roles";
import { useEffect, useState } from "react";

const STORAGE_KEY = "verlin-admin-sidebar-collapsed";

interface AdminLayoutShellProps {
  role: UserRole;
  children: React.ReactNode;
}

export function AdminLayoutShell({ role, children }: AdminLayoutShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

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
          "transition-[padding] duration-300 ease-in-out",
          collapsed ? "lg:pl-16" : "lg:pl-72"
        )}
      >
        <div className="container-verlin py-6 md:py-8">
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </>
  );
}