"use client";

/**
 * Interactive multi-role app runtime.
 * Banking & resume use specialized UIs; all other verticals use MultiModuleProductApp.
 */

import { BankingProductApp } from "@/components/app-studio/products/BankingProductApp";
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
}: {
  spec: StudioAppSpec;
  fullScreen?: boolean;
  className?: string;
}) {
  const productKind = detectProductKind(spec);
  const defaultRole =
    spec.roles.find((r) => r.isDefault)?.id || spec.roles[0]?.id || "member";
  const [roleId, setRoleId] = useState(defaultRole);
  const role = spec.roles.find((r) => r.id === roleId) || spec.roles[0];

  if (productKind === "resume") {
    return (
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <ResumeProductApp
          spec={spec}
          role={role}
          roleId={roleId}
          onRoleChange={setRoleId}
          fullScreen={fullScreen}
        />
      </div>
    );
  }
  if (productKind === "banking") {
    return (
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <BankingProductApp
          spec={spec}
          role={role}
          roleId={roleId}
          onRoleChange={setRoleId}
          fullScreen={fullScreen}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <MultiModuleProductApp
        spec={spec}
        role={role}
        roleId={roleId}
        onRoleChange={setRoleId}
        fullScreen={fullScreen}
      />
    </div>
  );
}
