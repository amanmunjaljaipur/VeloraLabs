"use client";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const ChatWidget = dynamic(
  () => import("@/components/chat/ChatWidget").then((m) => m.ChatWidget),
  { ssr: false }
);

const HIDDEN_PREFIXES = ["/admin", "/login", "/signup"];

export function ChatWidgetLoader() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  if (enabled) {
    return <ChatWidget autoOpen />;
  }

  return (
    <button
      type="button"
      onClick={() => setEnabled(true)}
      className={cn(
        "fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full",
        "bg-accent-teal text-white shadow-lg transition-shadow hover:shadow-glow-teal"
      )}
      aria-label="Open assistant"
    >
      <MessageCircle className="h-5 w-5" />
    </button>
  );
}