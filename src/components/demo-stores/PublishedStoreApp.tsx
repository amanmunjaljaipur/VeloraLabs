"use client";

/**
 * Public runtime for a published store at /s/{storeId}/[[...path]]
 */

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchPublishedStore } from "@/lib/demo-stores/storage";
import type { DemoStore } from "@/lib/demo-stores/types";
import { Bot, Loader2, MessageSquare, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function PublishedStoreApp({
  storeId,
  pathSegments = [],
}: {
  storeId: string;
  pathSegments?: string[];
}) {
  const [store, setStore] = useState<DemoStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<Array<{ role: "user" | "bot"; text: string }>>([]);

  const pageKey = (pathSegments[0] || "home").toLowerCase();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const s = await fetchPublishedStore(storeId);
      if (cancelled) return;
      if (!s || !s.published) {
        setError("Store not found or not published.");
        setStore(null);
      } else {
        setStore(s);
        setError(null);
        // bump visits locally
        try {
          const { saveLocalStore } = await import("@/lib/demo-stores/storage");
          saveLocalStore({ ...s, visits: (s.visits || 0) + 1 });
        } catch {
          /* ignore */
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const cmsPage = useMemo(() => {
    if (!store) return null;
    if (pageKey === "shop" || pageKey === "products") return null;
    return (
      store.cms.find((p) => p.id === pageKey && p.published) ||
      store.cms.find((p) => p.id === "home")
    );
  }, [store, pageKey]);

  function askBot() {
    if (!store || !chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput("");
    setChatLog((l) => [...l, { role: "user", text: q }]);
    const ql = q.toLowerCase();
    const hit = store.chatbot.faqs.find(
      (f) =>
        f.question.toLowerCase().includes(ql) ||
        ql.includes(f.question.toLowerCase().slice(0, 12)) ||
        f.answer.toLowerCase().includes(ql)
    );
    const answer = !store.chatbot.enabled
      ? "Chatbot is disabled for this store."
      : hit
        ? hit.answer
        : `I only answer using ${store.brandName}'s trained FAQs. Try: ${store.chatbot.faqs[0]?.question || "contact support"}.`;
    setTimeout(() => {
      setChatLog((l) => [...l, { role: "bot", text: answer }]);
    }, 200);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent-teal" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
        <p className="font-semibold">{error || "Not found"}</p>
        <Link href="/demo-apps" className="text-sm text-accent-teal hover:underline">
          Back to demos
        </Link>
      </div>
    );
  }

  const t = store.theme;

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{ background: t.surface || "#f8fafc", color: "#0f172a" }}
    >
      <header
        className="shrink-0 border-b px-3 py-3 text-white md:px-6"
        style={{ background: `linear-gradient(90deg, ${t.primary}, ${t.secondary})` }}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {store.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoDataUrl}
                alt=""
                className="h-9 w-9 rounded-lg bg-white object-contain"
              />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
                style={{ background: t.accent, color: t.primary }}
              >
                <ShoppingBag className="h-4 w-4" />
              </span>
            )}
            <div>
              <p className="font-bold">{store.brandName}</p>
              <p className="text-[10px] text-white/70">{store.tagline}</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1 text-sm">
            {[
              ["", "Home"],
              ["shop", "Shop"],
              ["about", "About"],
              ["contact", "Contact"],
              ["faq", "FAQ"],
            ].map(([seg, label]) => (
              <Link
                key={label}
                href={seg ? `/s/${store.id}/${seg}` : `/s/${store.id}`}
                className="rounded-lg px-2.5 py-1.5 hover:bg-white/10"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-3 py-6 md:px-6">
          {(pageKey === "shop" || pageKey === "products") && (
            <>
              <h1 className="text-2xl font-bold">Shop</h1>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(store.products.length
                  ? store.products.filter((p) => p.status === "Active")
                  : [
                      {
                        id: "demo1",
                        title: "Featured item",
                        price: 999,
                        description: "Add products in Store Super Admin.",
                        status: "Active" as const,
                      },
                    ]
                ).map((p) => (
                  <Card key={p.id} className="p-4">
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                    <p className="mt-2 text-lg font-bold" style={{ color: t.accent }}>
                      ₹{p.price.toLocaleString("en-IN")}
                    </p>
                  </Card>
                ))}
              </div>
            </>
          )}

          {pageKey !== "shop" && pageKey !== "products" && cmsPage && (
            <article className="prose prose-slate max-w-none">
              <h1 className="text-2xl font-bold tracking-tight">{cmsPage.title}</h1>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {cmsPage.body}
              </div>
            </article>
          )}

          {pageKey === "home" && (
            <section
              className="mt-8 rounded-3xl p-6 text-white md:p-10"
              style={{
                background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                /s/{store.id}
              </p>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">{store.brandName}</h2>
              <p className="mt-2 max-w-lg text-white/85">{store.tagline}</p>
              <Link href={`/s/${store.id}/shop`}>
                <Button type="button" className="mt-4 bg-white text-slate-900 hover:bg-white/90">
                  Browse products
                </Button>
              </Link>
            </section>
          )}
        </div>
      </main>

      {/* Store-scoped chatbot */}
      {store.chatbot.enabled && (
        <>
          {chatOpen && (
            <div className="fixed right-4 bottom-20 z-50 flex h-80 w-[min(100%-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
              <div
                className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-white"
                style={{ background: t.primary }}
              >
                <span className="flex items-center gap-1.5">
                  <Bot className="h-4 w-4" /> {store.brandName} help
                </span>
                <button type="button" onClick={() => setChatOpen(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
                <p className="rounded-lg bg-muted px-2 py-1.5 text-xs">
                  {store.chatbot.welcomeMessage}
                </p>
                {chatLog.map((m, i) => (
                  <p
                    key={i}
                    className={
                      m.role === "user"
                        ? "ml-6 rounded-lg bg-accent-teal/15 px-2 py-1.5 text-right"
                        : "mr-6 rounded-lg bg-muted px-2 py-1.5"
                    }
                  >
                    {m.text}
                  </p>
                ))}
              </div>
              <form
                className="flex gap-1 border-t p-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  askBot();
                }}
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about this store…"
                  className="min-w-0 flex-1 rounded-lg border border-border px-2 py-1.5 text-sm outline-none"
                />
                <Button type="submit" size="sm" variant="cta">
                  Send
                </Button>
              </form>
            </div>
          )}
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg"
            style={{ background: t.accent }}
            aria-label="Open chat"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </>
      )}

      <footer className="shrink-0 border-t border-border px-4 py-3 text-center text-[10px] text-muted-foreground">
        © {new Date().getFullYear()} {store.brandName} · /s/{store.id} · Store Super Admin publish
      </footer>
    </div>
  );
}
