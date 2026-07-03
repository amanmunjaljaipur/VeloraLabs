"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage, ChatResponse } from "@/lib/chat/types";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm the Verlin Labs assistant — trained on our FAQs, courses, and free session info. Ask me anything about programs, pricing, or booking.",
  suggestions: [
    "Is the free session really free?",
    "What are the course prices?",
    "How do I book the free session?",
  ],
};

let embedderPromise: Promise<(text: string) => Promise<number[]>> | null = null;

async function getQueryEmbedding(text: string): Promise<number[] | undefined> {
  try {
    if (!embedderPromise) {
      embedderPromise = (async () => {
        const { pipeline, env } = await import("@xenova/transformers");
        env.allowLocalModels = false;
        env.useBrowserCache = true;
        const pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        return async (input: string) => {
          const output = await pipe(input, { pooling: "mean", normalize: true });
          return Array.from(output.data as Float32Array);
        };
      })();
    }
    const embed = await embedderPromise;
    return await embed(text);
  } catch {
    return undefined;
  }
}

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const idRef = useRef(1);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${idRef.current++}`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const embedding = await getQueryEmbedding(trimmed);
      if (embedding) setModelReady(true);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, embedding }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = (await res.json()) as ChatResponse;
      const assistantMsg: ChatMessage = {
        id: `assistant-${idRef.current++}`,
        role: "assistant",
        content: data.answer,
        links: data.links,
        suggestions: data.suggestions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${idRef.current++}`,
          role: "assistant",
          content: "Something went wrong. Please try again or visit our FAQ page.",
          links: [{ label: "FAQ", href: "/faq" }],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const reset = useCallback(() => {
    setMessages([WELCOME]);
  }, []);

  return { messages, loading, modelReady, sendMessage, reset };
}