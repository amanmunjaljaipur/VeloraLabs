"use client";

/**
 * Interactive multi-role app runtime.
 * Banking & resume use specialized UIs; all other verticals use MultiModuleProductApp.
 */

import { BankingProductApp } from "@/components/app-studio/products/BankingProductApp";
import { EcomProductApp } from "@/components/app-studio/products/EcomProductApp";
import { MultiModuleProductApp } from "@/components/app-studio/products/MultiModuleProductApp";
import { ResumeProductApp } from "@/components/app-studio/products/ResumeProductApp";
import { detectProductKind } from "@/lib/app-studio/product-kind";
import type { StudioAppSpec } from "@/lib/app-studio/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function StudioWorkingApp({
  spec,
  fullScreen = false,
  className,
  sessionAccess = "app_admin",
  sessionName,
}: {
  spec: StudioAppSpec;
  fullScreen?: boolean;
  className?: string;
  /** app_admin may switch every product role; member stays on default */
  sessionAccess?: "app_admin" | "member";
  sessionName?: string;
}) {
  const productKind = detectProductKind(spec);
  const defaultRole =
    spec.roles.find((r) => r.isDefault)?.id || spec.roles[0]?.id || "member";
  const [roleId, setRoleId] = useState(defaultRole);
  const role = spec.roles.find((r) => r.id === roleId) || spec.roles[0];

  const canSwitchRoles = sessionAccess === "app_admin";

  function onRoleChange(id: string) {
    if (!canSwitchRoles && id !== defaultRole) {
      // Members cannot leave their default role
      return;
    }
    setRoleId(id);
  }

  // min-h-0 + overflow-hidden so nested product <main overflow-y-auto> can scroll.
  const shell = cn(
    "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
    className
  );

  const common = {
    spec,
    role,
    roleId,
    onRoleChange,
    fullScreen,
    canSwitchRoles,
    sessionName,
  };

  if (productKind === "resume") {
    return (
      <div className={shell}>
        <ResumeProductApp {...common} />
      </div>
    );
  }
  if (productKind === "banking") {
    return (
      <div className={shell}>
        <BankingProductApp {...common} />
      </div>
    );
  }
  if (productKind === "ecommerce") {
    return (
      <div className={shell}>
        <EcomProductApp {...common} />
      </div>
    );
  }

  return (
    <div className={shell}>
      <MultiModuleProductApp {...common} />
    </div>
  );
}
