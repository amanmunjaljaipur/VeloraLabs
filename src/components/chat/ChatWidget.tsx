"use client";

import { useChatbot } from "@/components/chat/useChatbot";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

const HIDDEN_PREFIXES = ["/admin", "/login", "/signup"];

const QUICK_PROMPTS = [
  "Is the free session free?",
  "Course prices?",
  "How to book?",
];

export function ChatWidget() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, loading, modelReady, sendMessage, reset } = useChatbot();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
  if (hidden) return null;

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input;
    setInput("");
    void sendMessage(msg);
  }

  function handlePrompt(prompt: string) {
    void sendMessage(prompt);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] bg-navy/20 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-0"
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
              "fixed z-[70] flex flex-col overflow-hidden border border-border bg-card shadow-xl surface-glass",
              "inset-x-3 bottom-20 max-h-[min(32rem,calc(100dvh-6rem))] rounded-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[22rem]"
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
                    {modelReady ? "On-device AI ready" : "FAQ-trained · runs locally"}
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
                        : "border border-border/80 bg-muted/40 text-foreground"
                    )}
                  >
                    <p>{msg.content}</p>
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
                    {msg.suggestions && msg.suggestions.length > 0 && msg.role === "assistant" && (
                      <div className="mt-2.5 flex flex-col gap-1">
                        {msg.suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handlePrompt(s)}
                            className="rounded-lg border border-border/70 bg-card/80 px-2.5 py-1.5 text-left text-xs text-text-secondary transition-colors hover:border-accent-teal/30 hover:text-accent-teal"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </div>
              )}
            </div>

            {!loading && messages.length <= 2 && (
              <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-4 py-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePrompt(p)}
                    className="rounded-full border border-border bg-card/80 px-2.5 py-1 text-[11px] text-text-secondary transition-colors hover:border-accent-teal/30 hover:text-accent-teal"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about courses, pricing, booking…"
                maxLength={500}
                className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-text-secondary/60 focus:border-accent-teal focus:outline-none focus:ring-2 focus:ring-accent-teal/20"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-teal text-white transition-colors hover:bg-teal disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            <div className="flex items-center justify-between border-t border-border/60 px-4 py-1.5">
              <button
                type="button"
                onClick={reset}
                className="text-[10px] text-text-muted transition-colors hover:text-text-secondary"
              >
                Clear chat
              </button>
              <Link
                href="/faq"
                className="text-[10px] text-text-muted transition-colors hover:text-accent-teal"
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