"use client";

import { ChatMessageContent } from "@/components/chat/ChatMessageContent";
import { useChatbot } from "@/components/chat/useChatbot";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Bot, ChevronRight, Loader2, MessageCircle, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const HIDDEN_PREFIXES = ["/admin", "/login", "/signup"];

export function ChatWidget({ autoOpen = false }: { autoOpen?: boolean }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(autoOpen);
  const {
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
  } = useChatbot();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));

  const activeCategory = menu?.categories.find((category) => category.name === selectedCategory);
  const questionLookup = new Map(
    menu?.categories.flatMap((category) =>
      category.questions.map((question) => [question.question, question.id] as const)
    ) ?? []
  );

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading, step]);

  if (hidden) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-x-0 bottom-0 top-16 z-[55] bg-navy/25 backdrop-blur-[2px] sm:top-20 sm:bg-navy/10"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Verlin Labs assistant"
            className={cn(
              "fixed z-[70] flex flex-col overflow-hidden border border-border bg-card shadow-xl dark:bg-card dark:shadow-2xl",
              "inset-x-3 bottom-20 max-h-[min(34rem,calc(100dvh-6rem))] rounded-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[22rem]"
            )}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-teal/15 text-accent-teal">
                  <Bot className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Verlin Assistant</p>
                  <p className="text-[11px] text-text-secondary">
                    {llmEnabled
                      ? `Powered by ${modelLabel ?? "free AI"} · ask or browse`
                      : "Browse FAQs or type a question"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-navy text-white"
                        : "border border-border bg-muted/60 text-foreground dark:bg-muted/80"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <ChatMessageContent content={msg.content} />
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    {msg.links && msg.links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="inline-flex rounded-lg border border-accent-teal/30 bg-accent-teal/10 px-2 py-0.5 text-xs font-medium text-accent-teal transition-colors hover:bg-accent-teal/20"
                            onClick={() => setOpen(false)}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                    {msg.suggestions &&
                      msg.suggestions.length > 0 &&
                      msg.role === "assistant" &&
                      step === "answered" && (
                        <div className="mt-2.5 flex flex-col gap-1">
                          {msg.suggestions.map((suggestion) => {
                            const entryId = questionLookup.get(suggestion);
                            return (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() =>
                                  entryId
                                    ? void selectQuestion(entryId, suggestion)
                                    : void sendMessage(suggestion)
                                }
                                disabled={loading}
                                className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-left text-xs text-foreground/85 transition-colors hover:border-accent-teal/40 hover:bg-accent-teal/10 hover:text-accent-teal disabled:opacity-50"
                              >
                                {suggestion}
                              </button>
                            );
                          })}
                        </div>
                      )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {llmEnabled ? "Thinking…" : "Loading answer…"}
                </div>
              )}
            </div>

            <div className="border-t border-border bg-card/80 px-3 py-3">
              {menuError && (
                <p className="mb-2 text-center text-xs text-text-secondary">
                  Could not load topics.{" "}
                  <Link href="/faq" className="text-accent-teal hover:underline" onClick={() => setOpen(false)}>
                    Visit FAQ
                  </Link>
                </p>
              )}

              {!menu && !menuError && (
                <div className="mb-2 flex items-center justify-center gap-2 py-2 text-xs text-text-secondary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading topics…
                </div>
              )}

              {menu && step === "categories" && (
                <div className="mb-3 space-y-2">
                  <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                    Choose a topic
                  </p>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {menu.categories.map((category) => (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => selectCategory(category.name)}
                        disabled={loading}
                        className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:border-accent-teal/40 hover:bg-accent-teal/10 hover:text-accent-teal disabled:opacity-50"
                      >
                        <span>{category.name}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {menu && step === "questions" && activeCategory && (
                <div className="mb-3 space-y-2">
                  <button
                    type="button"
                    onClick={backToCategories}
                    disabled={loading}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary transition-colors hover:text-accent-teal disabled:opacity-50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                    All topics
                  </button>
                  <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                    {activeCategory.name}
                  </p>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {activeCategory.questions.map((question) => (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => void selectQuestion(question.id, question.question)}
                        disabled={loading}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm leading-snug text-foreground transition-colors hover:border-accent-teal/40 hover:bg-accent-teal/10 hover:text-accent-teal disabled:opacity-50"
                      >
                        {question.question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {menu && step === "answered" && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={backToCategories}
                    disabled={loading}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent-teal/40 hover:bg-accent-teal/10 hover:text-accent-teal disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                    Browse topics
                  </button>
                  {activeCategory && (
                    <button
                      type="button"
                      onClick={showMoreQuestions}
                      disabled={loading}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-accent-teal/30 bg-accent-teal/10 px-3 py-2 text-sm font-medium text-accent-teal transition-colors hover:bg-accent-teal/20 disabled:opacity-50"
                    >
                      More in {activeCategory.name}
                    </button>
                  )}
                </div>
              )}

              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={llmEnabled ? "Ask anything…" : "Type a question…"}
                  disabled={loading}
                  maxLength={2000}
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent-teal focus:outline-none focus:ring-2 focus:ring-accent-teal/20 disabled:opacity-50"
                  aria-label="Message the assistant"
                />
                <button
                  type="submit"
                  disabled={loading || !draft.trim()}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-teal text-white transition hover:bg-teal disabled:opacity-40"
                  aria-label="Send message"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 px-4 py-1.5">
              <button
                type="button"
                onClick={reset}
                className="text-[10px] text-text-secondary transition-colors hover:text-foreground"
              >
                Start over
              </button>
              <Link
                href="/faq"
                className="text-[10px] text-text-secondary transition-colors hover:text-accent-teal"
                onClick={() => setOpen(false)}
              >
                Full FAQ →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-shadow",
          open
            ? "bg-card border border-border text-foreground hover:shadow-md"
            : "bg-accent-teal text-white hover:shadow-glow-teal"
        )}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </motion.button>
    </>
  );
}
