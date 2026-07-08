"use client";

import { buttonClassNames } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyLinkButtonProps {
  url: string;
  label?: string;
  onCopied?: (label: string) => void;
  className?: string;
}

export function CopyLinkButton({ url, label = "Link", onCopied, className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!url.trim()) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopied?.(label);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onCopied?.("");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={!url.trim()}
      aria-label={`Copy ${label}`}
      className={cn(
        buttonClassNames("secondary", "sm", className),
        "shrink-0 px-3",
        !url.trim() && "opacity-50"
      )}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}