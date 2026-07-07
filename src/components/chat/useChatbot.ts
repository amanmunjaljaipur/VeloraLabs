"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMenu, ChatMessage, ChatResponse } from "@/lib/chat/types";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm the Verlin Labs assistant.\n\n**Choose a topic below** — then pick a question for a quick, accurate answer from our FAQs.",
};

export type ChatStep = "categories" | "questions" | "answered";

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState<ChatMenu | null>(null);
  const [menuError, setMenuError] = useState(false);
  const [step, setStep] = useState<ChatStep>("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
        content: `Great — pick a question about **${category}**: `,
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

  const backToCategories = useCallback(() => {
    setStep("categories");
    setSelectedCategory(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-${idRef.current++}`,
        role: "assistant",
        content: "No problem — **choose another topic** below.",
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
    setMessages([WELCOME]);
    setStep("categories");
    setSelectedCategory(null);
  }, []);

  return {
    messages,
    loading,
    menu,
    menuError,
    step,
    selectedCategory,
    selectCategory,
    selectQuestion,
    backToCategories,
    showMoreQuestions,
    reset,
  };
}