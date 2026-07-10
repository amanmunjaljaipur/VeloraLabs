"use client";

/**
 * Store Super Admin console — rights scoped to this store module only.
 * Brand/theme, category, CMS, CRM, chatbot training, products, publish to /s/{id}.
 */

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { DemoAppSession } from "@/lib/demo-apps/demo-auth";
import {
  createStoreDraft,
  fileToDataUrl,
  listStoresForOwner,
  publishStoreToServer,
  saveLocalStore,
} from "@/lib/demo-stores/storage";
import {
  CATEGORY_OPTIONS,
  STORE_OWNER_EXCLUDED,
  STORE_OWNER_RIGHTS,
  storePublicPath,
  type DemoStore,
  type StoreCategoryId,
  type StoreCmsPage,
} from "@/lib/demo-stores/types";
import { cn } from "@/lib/utils";
import {
  Bot,
  ExternalLink,
  Globe,
  LayoutTemplate,
  Loader2,
  MessageSquare,
  Palette,
  Plus,
  Shield,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Section =
  | "overview"
  | "brand"
  | "cms"
  | "crm"
  | "chatbot"
  | "products"
  | "publish"
  | "rights";

export function StoreStudio({
  session,
  sourceDemoSlug,
  defaultCategory,
  defaultBrand,
  onClose,
}: {
  session: DemoAppSession;
  sourceDemoSlug?: string;
  defaultCategory?: StoreCategoryId;
  defaultBrand?: string;
  onClose?: () => void;
}) {
  const [section, setSection] = useState<Section>("overview");
  const [stores, setStores] = useState<DemoStore[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(() => {
    const list = listStoresForOwner(session.email);
    setStores(list);
    if (activeId && !list.some((s) => s.id === activeId)) {
      setActiveId(list[0]?.id || null);
    } else if (!activeId && list[0]) {
      setActiveId(list[0].id);
    }
  }, [session.email, activeId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const store = stores.find((s) => s.id === activeId) || null;

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 3500);
  }

  function createNew() {
    const draft = createStoreDraft({
      categoryId: defaultCategory || "mass-marketplace",
      brandName: defaultBrand || `${session.name}'s Store`,
      ownerEmail: session.email,
      ownerName: session.name,
      sourceDemoSlug,
    });
    saveLocalStore(draft);
    reload();
    setActiveId(draft.id);
    setSection("brand");
    flash(`Created draft ${draft.id}`);
  }

  function patch(partial: Partial<DemoStore>) {
    if (!store) return;
    const next = saveLocalStore({ ...store, ...partial });
    setStores(listStoresForOwner(session.email));
    setActiveId(next.id);
  }

  async function onLogo(file: File | null) {
    if (!file || !store) return;
    if (!file.type.startsWith("image/")) {
      flash("Upload an image file");
      return;
    }
    if (file.size > 1.5e6) {
      flash("Logo must be under 1.5MB");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    patch({ logoDataUrl: dataUrl });
    flash("Logo updated");
  }

  async function publish() {
    if (!store) return;
    if (!store.brandName.trim()) {
      flash("Set a brand name first");
      return;
    }
    setBusy(true);
    const res = await publishStoreToServer(store);
    setBusy(false);
    reload();
    if (res.ok) {
      flash(
        res.error
          ? `Published ${store.id} (local). ${res.error}`
          : `Published live at ${storePublicPath(store.id)}`
      );
      setSection("publish");
    } else {
      flash(res.error || "Publish failed");
    }
  }

  const nav: Array<{ id: Section; label: string; icon: typeof Store }> = [
    { id: "overview", label: "Overview", icon: Store },
    { id: "brand", label: "Theme & brand", icon: Palette },
    { id: "cms", label: "Site CMS", icon: LayoutTemplate },
    { id: "crm", label: "CRM", icon: Users },
    { id: "chatbot", label: "Chatbot", icon: Bot },
    { id: "products", label: "Products", icon: Globe },
    { id: "publish", label: "Publish", icon: ExternalLink },
    { id: "rights", label: "Your rights", icon: Shield },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-navy px-3 py-2.5 text-white">
        <div>
          <p className="text-sm font-bold">Store Super Admin</p>
          <p className="text-[10px] text-white/65">
            Module-scoped rights only · {session.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="cta" onClick={createNew}>
            <Plus className="h-3.5 w-3.5" /> New store
          </Button>
          {onClose && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={onClose}
            >
              Back to app
            </Button>
          )}
        </div>
      </header>

      {msg && (
        <div className="shrink-0 bg-accent-teal/10 px-4 py-2 text-sm text-accent-teal">{msg}</div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-48 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="border-b border-border p-2">
            <p className="px-2 text-[10px] font-semibold uppercase text-muted-foreground">
              Your stores
            </p>
            <div className="mt-1 max-h-40 space-y-0.5 overflow-y-auto">
              {stores.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={cn(
                    "w-full truncate rounded-lg px-2 py-1.5 text-left text-xs",
                    activeId === s.id
                      ? "bg-accent-teal/15 font-semibold text-accent-teal"
                      : "hover:bg-muted"
                  )}
                >
                  {s.brandName}
                  <span className="block text-[10px] font-normal text-muted-foreground">
                    /s/{s.id} {s.published ? "· live" : "· draft"}
                  </span>
                </button>
              ))}
              {!stores.length && (
                <p className="px-2 py-2 text-[11px] text-muted-foreground">No stores yet</p>
              )}
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 p-2">
            {nav.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSection(n.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm",
                  section === n.id
                    ? "bg-accent-teal/15 font-semibold text-accent-teal"
                    : "hover:bg-muted"
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto p-3 md:p-5">
          {!store ? (
            <Card className="mx-auto max-w-lg p-8 text-center">
              <Store className="mx-auto h-10 w-10 text-muted-foreground" />
              <h1 className="mt-3 text-xl font-bold">Build your own store</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick a category, brand it, train a chatbot on your content, then publish to a
                permanent path like <code className="text-accent-teal">/s/ecom-food_1</code>.
              </p>
              <Button type="button" className="mt-4" variant="cta" onClick={createNew}>
                <Plus className="h-4 w-4" /> Create first store
              </Button>
            </Card>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {/* Mobile section + store picker */}
              <div className="flex flex-wrap gap-2 md:hidden">
                <select
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                  value={activeId || ""}
                  onChange={(e) => setActiveId(e.target.value)}
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.brandName}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                  value={section}
                  onChange={(e) => setSection(e.target.value as Section)}
                >
                  {nav.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>

              {section === "overview" && (
                <>
                  <h1 className="text-2xl font-bold">{store.brandName}</h1>
                  <p className="text-sm text-muted-foreground">
                    Extension <code className="rounded bg-muted px-1">/s/{store.id}</code>
                    {store.published ? " · Published" : " · Draft"} · visits {store.visits}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="p-4">
                      <p className="text-xs text-muted-foreground">CRM leads</p>
                      <p className="text-2xl font-bold">{store.crm.length}</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs text-muted-foreground">Chatbot FAQs</p>
                      <p className="text-2xl font-bold">{store.chatbot.faqs.length}</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs text-muted-foreground">Products</p>
                      <p className="text-2xl font-bold">{store.products.length}</p>
                    </Card>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="cta" onClick={() => setSection("brand")}>
                      Edit brand
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setSection("publish")}>
                      Publish
                    </Button>
                    {store.published && (
                      <Link href={storePublicPath(store.id)} target="_blank">
                        <Button type="button" variant="secondary">
                          <ExternalLink className="h-4 w-4" /> Open live store
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              )}

              {section === "brand" && (
                <>
                  <h1 className="text-2xl font-bold">Theme & brand</h1>
                  <Card className="space-y-3 p-5">
                    <label className="block text-sm">
                      <span className="font-medium">Store name</span>
                      <Input
                        className="mt-1"
                        value={store.brandName}
                        onChange={(e) => patch({ brandName: e.target.value })}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Tagline</span>
                      <Input
                        className="mt-1"
                        value={store.tagline}
                        onChange={(e) => patch({ tagline: e.target.value })}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Category</span>
                      <select
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                        value={store.categoryId}
                        onChange={(e) =>
                          patch({ categoryId: e.target.value as StoreCategoryId })
                        }
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label} (prefix {c.prefix}_)
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-1 block w-full text-sm"
                        onChange={(e) => void onLogo(e.target.files?.[0] || null)}
                      />
                      {store.logoDataUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={store.logoDataUrl}
                          alt="Logo"
                          className="mt-2 h-16 w-16 rounded-xl border object-contain"
                        />
                      )}
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["primary", "Primary"],
                          ["secondary", "Secondary"],
                          ["accent", "Accent"],
                          ["surface", "Surface"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="block text-sm">
                          <span className="font-medium">{label}</span>
                          <div className="mt-1 flex gap-2">
                            <input
                              type="color"
                              value={store.theme[key]}
                              onChange={(e) =>
                                patch({
                                  theme: { ...store.theme, [key]: e.target.value },
                                })
                              }
                              className="h-10 w-12 cursor-pointer rounded border"
                            />
                            <Input
                              value={store.theme[key]}
                              onChange={(e) =>
                                patch({
                                  theme: { ...store.theme, [key]: e.target.value },
                                })
                              }
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                    <div
                      className="rounded-2xl p-4 text-white"
                      style={{
                        background: `linear-gradient(135deg, ${store.theme.primary}, ${store.theme.accent})`,
                      }}
                    >
                      <p className="text-xs opacity-80">Preview</p>
                      <p className="text-lg font-bold">{store.brandName}</p>
                      <p className="text-sm opacity-90">{store.tagline}</p>
                    </div>
                  </Card>
                </>
              )}

              {section === "cms" && (
                <>
                  <h1 className="text-2xl font-bold">Site CMS</h1>
                  <p className="text-sm text-muted-foreground">
                    Pages for this store only (home, about, contact, FAQ, privacy).
                  </p>
                  {store.cms.map((page, i) => (
                    <CmsEditor
                      key={page.id}
                      page={page}
                      onChange={(next) => {
                        const cms = [...store.cms];
                        cms[i] = next;
                        patch({ cms });
                      }}
                    />
                  ))}
                </>
              )}

              {section === "crm" && (
                <>
                  <h1 className="text-2xl font-bold">CRM</h1>
                  <p className="text-sm text-muted-foreground">
                    Leads for <strong>{store.brandName}</strong> only.
                  </p>
                  <Button
                    type="button"
                    variant="cta"
                    size="sm"
                    onClick={() => {
                      const lead = {
                        id: `lead-${Date.now().toString(36)}`,
                        name: "New lead",
                        email: "lead@example.com",
                        stage: "new" as const,
                        createdAt: new Date().toISOString(),
                        note: "",
                      };
                      patch({ crm: [lead, ...store.crm] });
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add lead
                  </Button>
                  {store.crm.map((lead) => (
                    <Card key={lead.id} className="space-y-2 p-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          value={lead.name}
                          onChange={(e) => {
                            patch({
                              crm: store.crm.map((c) =>
                                c.id === lead.id ? { ...c, name: e.target.value } : c
                              ),
                            });
                          }}
                          placeholder="Name"
                        />
                        <Input
                          value={lead.email}
                          onChange={(e) => {
                            patch({
                              crm: store.crm.map((c) =>
                                c.id === lead.id ? { ...c, email: e.target.value } : c
                              ),
                            });
                          }}
                          placeholder="Email"
                        />
                      </div>
                      <select
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                        value={lead.stage}
                        onChange={(e) => {
                          patch({
                            crm: store.crm.map((c) =>
                              c.id === lead.id
                                ? { ...c, stage: e.target.value as typeof lead.stage }
                                : c
                            ),
                          });
                        }}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          patch({ crm: store.crm.filter((c) => c.id !== lead.id) })
                        }
                      >
                        Delete
                      </Button>
                    </Card>
                  ))}
                  {!store.crm.length && (
                    <p className="text-sm text-muted-foreground">No leads yet.</p>
                  )}
                </>
              )}

              {section === "chatbot" && (
                <>
                  <h1 className="text-2xl font-bold">Chatbot training</h1>
                  <p className="text-sm text-muted-foreground">
                    Pretrained only on <strong>this store&apos;s</strong> persona + FAQs — not the
                    platform Verlin chatbot corpus.
                  </p>
                  <Card className="space-y-3 p-5">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={store.chatbot.enabled}
                        onChange={(e) =>
                          patch({
                            chatbot: { ...store.chatbot, enabled: e.target.checked },
                          })
                        }
                      />
                      Enable store chatbot
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Welcome message</span>
                      <Input
                        className="mt-1"
                        value={store.chatbot.welcomeMessage}
                        onChange={(e) =>
                          patch({
                            chatbot: {
                              ...store.chatbot,
                              welcomeMessage: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Persona / system note</span>
                      <textarea
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                        rows={3}
                        value={store.chatbot.persona}
                        onChange={(e) =>
                          patch({
                            chatbot: { ...store.chatbot, persona: e.target.value },
                          })
                        }
                      />
                    </label>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">FAQs</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          patch({
                            chatbot: {
                              ...store.chatbot,
                              faqs: [
                                ...store.chatbot.faqs,
                                {
                                  id: `f-${Date.now().toString(36)}`,
                                  question: "New question?",
                                  answer: "Answer…",
                                },
                              ],
                            },
                          })
                        }
                      >
                        <Plus className="h-3.5 w-3.5" /> Add FAQ
                      </Button>
                    </div>
                    {store.chatbot.faqs.map((f) => (
                      <div key={f.id} className="space-y-1 rounded-xl border border-border p-3">
                        <Input
                          value={f.question}
                          onChange={(e) =>
                            patch({
                              chatbot: {
                                ...store.chatbot,
                                faqs: store.chatbot.faqs.map((x) =>
                                  x.id === f.id ? { ...x, question: e.target.value } : x
                                ),
                              },
                            })
                          }
                          placeholder="Question"
                        />
                        <textarea
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                          rows={2}
                          value={f.answer}
                          onChange={(e) =>
                            patch({
                              chatbot: {
                                ...store.chatbot,
                                faqs: store.chatbot.faqs.map((x) =>
                                  x.id === f.id ? { ...x, answer: e.target.value } : x
                                ),
                              },
                            })
                          }
                          placeholder="Answer"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            patch({
                              chatbot: {
                                ...store.chatbot,
                                faqs: store.chatbot.faqs.filter((x) => x.id !== f.id),
                              },
                            })
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </Card>
                </>
              )}

              {section === "products" && (
                <>
                  <h1 className="text-2xl font-bold">Products</h1>
                  <Button
                    type="button"
                    size="sm"
                    variant="cta"
                    onClick={() =>
                      patch({
                        products: [
                          {
                            id: `pr-${Date.now().toString(36)}`,
                            title: "New product",
                            price: 499,
                            description: "Description",
                            status: "Active",
                          },
                          ...store.products,
                        ],
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> Add product
                  </Button>
                  {store.products.map((p) => (
                    <Card key={p.id} className="space-y-2 p-4">
                      <Input
                        value={p.title}
                        onChange={(e) =>
                          patch({
                            products: store.products.map((x) =>
                              x.id === p.id ? { ...x, title: e.target.value } : x
                            ),
                          })
                        }
                      />
                      <Input
                        type="number"
                        value={p.price}
                        onChange={(e) =>
                          patch({
                            products: store.products.map((x) =>
                              x.id === p.id ? { ...x, price: Number(e.target.value) || 0 } : x
                            ),
                          })
                        }
                      />
                      <textarea
                        className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                        rows={2}
                        value={p.description}
                        onChange={(e) =>
                          patch({
                            products: store.products.map((x) =>
                              x.id === p.id ? { ...x, description: e.target.value } : x
                            ),
                          })
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          patch({ products: store.products.filter((x) => x.id !== p.id) })
                        }
                      >
                        Delete
                      </Button>
                    </Card>
                  ))}
                </>
              )}

              {section === "publish" && (
                <>
                  <h1 className="text-2xl font-bold">Publish forever path</h1>
                  <Card className="space-y-3 p-5">
                    <p className="text-sm">
                      Public URL:{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-accent-teal">
                        {storePublicPath(store.id)}
                      </code>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Product and CMS links append after this base, e.g.{" "}
                      <code>{storePublicPath(store.id)}/about</code>,{" "}
                      <code>{storePublicPath(store.id)}/shop</code>.
                    </p>
                    <p className="text-sm">
                      Status:{" "}
                      <strong>{store.published ? "Published" : "Draft — not public yet"}</strong>
                    </p>
                    <Button type="button" variant="cta" disabled={busy} onClick={() => void publish()}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {store.published ? "Re-publish updates" : "Publish store"}
                    </Button>
                    {store.published && (
                      <Link
                        href={storePublicPath(store.id)}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-sm font-medium text-accent-teal hover:underline"
                      >
                        Open {storePublicPath(store.id)} <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </Card>
                </>
              )}

              {section === "rights" && (
                <>
                  <h1 className="text-2xl font-bold">Your rights (this module)</h1>
                  <Card className="space-y-2 p-5">
                    <p className="text-sm text-muted-foreground">
                      Store Super Admin is <strong>not</strong> platform super_admin. You only get
                      product-relevant tools for stores you own.
                    </p>
                    <p className="text-xs font-semibold uppercase text-emerald-700">Granted</p>
                    <ul className="list-inside list-disc text-sm">
                      {STORE_OWNER_RIGHTS.map((r) => (
                        <li key={r}>
                          <code>{r}</code>
                        </li>
                      ))}
                    </ul>
                    <p className="pt-2 text-xs font-semibold uppercase text-red-700">Not granted</p>
                    <ul className="list-inside list-disc text-sm text-muted-foreground">
                      {STORE_OWNER_EXCLUDED.map((r) => (
                        <li key={r}>
                          <code>{r}</code>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CmsEditor({
  page,
  onChange,
}: {
  page: StoreCmsPage;
  onChange: (p: StoreCmsPage) => void;
}) {
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold capitalize">{page.id}</p>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={page.published}
            onChange={(e) => onChange({ ...page, published: e.target.checked })}
          />
          Published
        </label>
      </div>
      <Input
        value={page.title}
        onChange={(e) => onChange({ ...page, title: e.target.value })}
      />
      <textarea
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        rows={4}
        value={page.body}
        onChange={(e) => onChange({ ...page, body: e.target.value })}
      />
      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <MessageSquare className="h-3 w-3" /> Path: /s/…/{page.id === "home" ? "" : page.id}
      </p>
    </Card>
  );
}
