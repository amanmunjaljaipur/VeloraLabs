"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMenu, ChatMessage, ChatResponse } from "@/lib/chat/types";

const WELCOME_FAQ: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm the Verlin Labs assistant.\n\n**Choose a topic below**, pick a question, or **type your own question** for a clear answer.",
};

function welcomeLlm(label: string): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: `Hi! I'm the Verlin Labs assistant powered by **${label}** (free tier).\n\nAsk anything about our free session, courses, pricing, or teaching style — or browse topics below.`,
  };
}

export type ChatStep = "categories" | "questions" | "answered" | "chat";

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_FAQ]);
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState<ChatMenu | null>(null);
  const [menuError, setMenuError] = useState(false);
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [modelLabel, setModelLabel] = useState<string | null>(null);
  const [step, setStep] = useState<ChatStep>("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const idRef = useRef(1);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      try {
        const res = await fetch("/api/chat");
        if (!res.ok) throw new Error("Failed to load menu");
        const data = (await res.json()) as ChatMenu;
        if (!cancelled) {
          setMenu(data);
          setMenuError(false);
          const enabled = Boolean(data.llmEnabled);
          setLlmEnabled(enabled);
          const label = data.modelLabel || data.model || "AI";
          setModelLabel(enabled ? label : null);
          setMessages([enabled ? welcomeLlm(label) : WELCOME_FAQ]);
        }
      } catch {
        if (!cancelled) setMenuError(true);
      }
    }

    void loadMenu();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectCategory = useCallback((category: string) => {
    setSelectedCategory(category);
    setStep("questions");
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${idRef.current++}`,
        role: "user",
        content: category,
      },
      {
        id: `assistant-${idRef.current++}`,
        role: "assistant",
        content: `Great — pick a question about **${category}**, or type your own:`,
      },
    ]);
  }, []);

  const selectQuestion = useCallback(
    async (entryId: string, question: string) => {
      if (loading) return;

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${idRef.current++}`,
          role: "user",
          content: question,
        },
      ]);
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId }),
        });

        if (!res.ok) {
          throw new Error("Request failed");
        }

        const data = (await res.json()) as ChatResponse;
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${idRef.current++}`,
            role: "assistant",
            content: data.answer,
            links: data.links,
            suggestions: data.suggestions,
          },
        ]);
        setStep("answered");
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
    },
    [loading]
  );

  const sendMessage = useCallback(
    async (text?: string) => {
      const message = (text ?? draft).trim();
      if (!message || loading) return;

      setDraft("");
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${idRef.current++}`,
          role: "user",
          content: message,
        },
      ]);
      setLoading(true);
      setStep("chat");

      try {
        const history = messages
          .filter((m) => m.id !== "welcome")
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, history }),
        });

        if (!res.ok) {
          throw new Error("Request failed");
        }

        const data = (await res.json()) as ChatResponse;
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${idRef.current++}`,
            role: "assistant",
            content: data.answer,
            links: data.links,
            suggestions: data.suggestions,
          },
        ]);
        setStep("answered");
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
    },
    [draft, loading, messages]
  );

  const backToCategories = useCallback(() => {
    setStep("categories");
    setSelectedCategory(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-${idRef.current++}`,
        role: "assistant",
        content: "No problem — **choose another topic** below, or type a question.",
      },
    ]);
  }, []);

  const showMoreQuestions = useCallback(() => {
    if (!selectedCategory) return;
    setStep("questions");
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-${idRef.current++}`,
        role: "assistant",
        content: `More questions about **${selectedCategory}**:`,
      },
    ]);
  }, [selectedCategory]);

  const reset = useCallback(() => {
    setMessages([
      llmEnabled && modelLabel ? welcomeLlm(modelLabel) : WELCOME_FAQ,
    ]);
    setStep("categories");
    setSelectedCategory(null);
    setDraft("");
  }, [llmEnabled, modelLabel]);

  return {
    messages,
    loading,
    menu,
    menuError,
    llmEnabled,
    modelLabel,
    step,
    selectedCategory,
    draft,
    setDraft,
    selectCategory,
    selectQuestion,
    sendMessage,
    backToCategories,
    showMoreQuestions,
    reset,
  };
}
