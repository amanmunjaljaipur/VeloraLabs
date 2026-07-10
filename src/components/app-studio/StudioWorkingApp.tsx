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

  // min-h-0 + overflow-hidden so nested product <main overflow-y-auto> can scroll.
  const shell = cn(
    "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
    className
  );

  if (productKind === "resume") {
    return (
      <div className={shell}>
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
      <div className={shell}>
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
  if (productKind === "ecommerce") {
    return (
      <div className={shell}>
        <EcomProductApp
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
    <div className={shell}>
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
