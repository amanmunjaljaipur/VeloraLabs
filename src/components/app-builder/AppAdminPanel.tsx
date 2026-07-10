"use client";

import type { AppRoute, AppUserView } from "@/components/app-builder/StandaloneAppRuntime";
import type { EcomLocalShopContent, EcomProduct } from "@/lib/app-builder/types";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Shield,
  MessageSquare,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  items: Array<{ name: string; price: string; qty: number }>;
  note?: string;
  createdAt: string;
};

type Role = {
  id: string;
  label: string;
  description: string;
  capabilities: string[];
  system?: boolean;
  isDefault?: boolean;
};

type Member = {
  id: string;
  email: string;
  name: string;
  roleId: string;
  source?: string;
};

export function AppAdminPanel({
  slug,
  content,
  accent,
  user,
  section,
  onSection,
  onContentUpdated,
  staffOnly,
}: {
  slug: string;
  content: EcomLocalShopContent;
  accent: string;
  user: AppUserView;
  section: AppRoute;
  onSection: (r: AppRoute) => void;
  onContentUpdated: (c: EcomLocalShopContent) => void;
  staffOnly?: boolean;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [defaultRoleId, setDefaultRoleId] = useState("customer");
  const [members, setMembers] = useState<Member[]>([]);
  const [productsJson, setProductsJson] = useState("");
  const [invite, setInvite] = useState({ email: "", name: "", password: "", roleId: "staff" });
  const [msg, setMsg] = useState("");
  const [inquiries, setInquiries] = useState<
    Array<{ id: string; name: string; email: string; message: string; status: string }>
  >([]);

  const refreshOrders = useCallback(async () => {
    const res = await fetch(`/api/apps/${slug}/admin/orders`);
    if (res.ok) {
      const data = (await res.json()) as { orders: Order[] };
      setOrders(data.orders || []);
    }
  }, [slug]);

  const refreshRoles = useCallback(async () => {
    const res = await fetch(`/api/apps/${slug}/admin/roles`);
    if (res.ok) {
      const data = (await res.json()) as {
        roles: Role[];
        defaultRoleId: string;
        members: Member[];
      };
      setRoles(data.roles || []);
      setDefaultRoleId(data.defaultRoleId);
      setMembers(data.members || []);
    }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (section === "admin" || section === "admin-orders") {
        const res = await fetch(`/api/apps/${slug}/admin/orders`);
        if (!cancelled && res.ok) {
          const data = (await res.json()) as { orders: Order[] };
          setOrders(data.orders || []);
        }
        const ir = await fetch(`/api/apps/${slug}/admin/inquiries`);
        if (!cancelled && ir.ok) {
          const data = (await ir.json()) as {
            inquiries: Array<{
              id: string;
              name: string;
              email: string;
              message: string;
              status: string;
            }>;
          };
          setInquiries(data.inquiries || []);
        }
      }
      if (section === "admin-roles" || section === "admin-customers") {
        const res = await fetch(`/api/apps/${slug}/admin/roles`);
        if (!cancelled && res.ok) {
          const data = (await res.json()) as {
            roles: Role[];
            defaultRoleId: string;
            members: Member[];
          };
          setRoles(data.roles || []);
          setDefaultRoleId(data.defaultRoleId);
          setMembers(data.members || []);
        }
      }
      if (section === "admin-products" && !cancelled) {
        setProductsJson(JSON.stringify(content.products, null, 2));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [section, slug, content.products]);

  const nav: Array<{ id: AppRoute; label: string; icon: typeof Package; staff?: boolean }> = [
    { id: "admin", label: "Overview", icon: LayoutDashboard },
    { id: "admin-orders", label: "Orders", icon: ShoppingBag },
    { id: "admin-products", label: "Products", icon: Package, staff: false },
    { id: "admin-customers", label: "Team", icon: Users, staff: false },
    { id: "admin-roles", label: "Roles", icon: Shield, staff: false },
    { id: "admin-settings", label: "Settings", icon: Settings, staff: false },
  ].filter((n) => !staffOnly || n.staff !== false || n.id === "admin" || n.id === "admin-orders");

  async function saveProducts() {
    setMsg("");
    try {
      const products = JSON.parse(productsJson) as EcomProduct[];
      const res = await fetch(`/api/apps/${slug}/admin/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      const data = (await res.json()) as { content?: EcomLocalShopContent; error?: string };
      if (!res.ok) {
        setMsg(data.error || "Save failed");
        return;
      }
      if (data.content) onContentUpdated(data.content);
      setMsg("Products saved");
    } catch {
      setMsg("Invalid JSON — check product list format");
    }
  }

  async function saveSettings(form: FormData) {
    setMsg("");
    const res = await fetch(`/api/apps/${slug}/admin/content`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: String(form.get("brandName") || ""),
        tagline: String(form.get("tagline") || ""),
        contactPhone: String(form.get("contactPhone") || ""),
        whatsappNumber: String(form.get("whatsappNumber") || ""),
        openingHours: String(form.get("openingHours") || ""),
        address: String(form.get("address") || ""),
      }),
    });
    const data = (await res.json()) as { content?: EcomLocalShopContent; error?: string };
    if (!res.ok) {
      setMsg(data.error || "Save failed");
      return;
    }
    if (data.content) onContentUpdated(data.content);
    setMsg("Settings saved");
  }

  async function inviteMember() {
    setMsg("");
    const res = await fetch(`/api/apps/${slug}/admin/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invite),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMsg(data.error || "Invite failed");
      return;
    }
    setMsg("Team member added");
    setInvite({ email: "", name: "", password: "", roleId: "staff" });
    void refreshRoles();
  }

  async function saveRoles() {
    setMsg("");
    const res = await fetch(`/api/apps/${slug}/admin/roles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles, defaultRoleId }),
    });
    const data = (await res.json()) as { error?: string; roles?: Role[] };
    if (!res.ok) {
      setMsg(data.error || "Could not save roles");
      return;
    }
    if (data.roles) setRoles(data.roles);
    setMsg("Roles updated — new sign-ups get the default role");
  }

  async function setOrderStatus(orderId: string, status: string) {
    await fetch(`/api/apps/${slug}/admin/orders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    void refreshOrders();
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[200px_1fr]">
      <aside className="space-y-1">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {content.brandName} admin
        </p>
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onSection(n.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium",
                section === n.id ? "text-white" : "hover:bg-muted"
              )}
              style={section === n.id ? { background: accent } : undefined}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </button>
          );
        })}
        <p className="mt-4 text-[11px] text-text-muted">
          Signed in as {user.roleLabel}
          {user.viaPlatformSuperAdmin ? " (platform)" : ""}
        </p>
      </aside>

      <div className="min-w-0 space-y-4">
        {msg ? (
          <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">{msg}</p>
        ) : null}

        {section === "admin" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Products" value={String(content.products.length)} />
              <Stat label="Orders" value={String(orders.length)} />
              <Stat label="Messages" value={String(inquiries.length)} />
            </div>
            <p className="text-sm text-text-secondary">
              Manage this shop only — no Verlin Labs menus. Invite staff, set roles, and take orders.
            </p>
            <div className="rounded-xl border border-border p-4">
              <h2 className="flex items-center gap-2 font-semibold">
                <MessageSquare className="h-4 w-4" /> Recent messages
              </h2>
              {inquiries.length === 0 ? (
                <p className="mt-2 text-sm text-text-muted">No customer messages yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {inquiries.slice(0, 5).map((i) => (
                    <li key={i.id} className="rounded-lg border border-border p-2">
                      <strong>{i.name}</strong> · {i.email}
                      <p className="text-text-secondary">{i.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {section === "admin-orders" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Orders</h1>
            {orders.length === 0 ? (
              <p className="text-sm text-text-secondary">No orders yet.</p>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {o.customerName} · {o.customerEmail}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(o.createdAt).toLocaleString()} · {o.status}
                      </p>
                    </div>
                    <select
                      className="rounded-lg border border-border bg-background px-2 py-1"
                      value={o.status}
                      onChange={(e) => void setOrderStatus(o.id, e.target.value)}
                    >
                      {["new", "confirmed", "fulfilled", "cancelled"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ul className="mt-2 list-inside list-disc text-text-secondary">
                    {o.items.map((it, idx) => (
                      <li key={idx}>
                        {it.qty}× {it.name} — {it.price}
                      </li>
                    ))}
                  </ul>
                  {o.note ? <p className="mt-2 text-text-muted">Note: {o.note}</p> : null}
                </div>
              ))
            )}
          </div>
        )}

        {section === "admin-products" && !staffOnly && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Products</h1>
            <p className="text-sm text-text-secondary">
              Edit the product list as JSON (name, price, category, description, emoji). Save when ready.
            </p>
            <textarea
              value={productsJson}
              onChange={(e) => setProductsJson(e.target.value)}
              rows={16}
              className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => void saveProducts()}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: accent }}
            >
              Save products
            </button>
          </div>
        )}

        {section === "admin-customers" && !staffOnly && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Team</h1>
            <ul className="space-y-2 text-sm">
              {members.map((m) => (
                <li key={m.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-border p-3">
                  <span>
                    <strong>{m.name}</strong> · {m.email}
                  </span>
                  <span className="text-text-muted">{m.roleId}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-border p-4 space-y-3">
              <h2 className="font-semibold">Add team member</h2>
              <input
                placeholder="Name"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={invite.name}
                onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                placeholder="Email"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={invite.email}
                onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                placeholder="Temporary password (8+)"
                type="password"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={invite.password}
                onChange={(e) => setInvite((p) => ({ ...p, password: e.target.value }))}
              />
              <select
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={invite.roleId}
                onChange={(e) => setInvite((p) => ({ ...p, roleId: e.target.value }))}
              >
                {roles
                  .filter((r) => r.id !== "customer")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => void inviteMember()}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: accent }}
              >
                Add member
              </button>
            </div>
          </div>
        )}

        {section === "admin-roles" && !staffOnly && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Roles</h1>
            <p className="text-sm text-text-secondary">
              Define who can do what in <strong>this shop only</strong>. New sign-ups get the default role
              (usually Customer).
            </p>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-text-secondary">
                Default role for new sign-ups
              </span>
              <select
                className="w-full rounded-xl border border-border px-3 py-2"
                value={defaultRoleId}
                onChange={(e) => setDefaultRoleId(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-3">
              {roles.map((r, idx) => (
                <div key={r.id} className="rounded-xl border border-border p-4 space-y-2">
                  <input
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm font-semibold"
                    value={r.label}
                    disabled={r.id === "super_admin"}
                    onChange={(e) => {
                      const next = [...roles];
                      next[idx] = { ...r, label: e.target.value };
                      setRoles(next);
                    }}
                  />
                  <textarea
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                    rows={2}
                    value={r.description}
                    onChange={(e) => {
                      const next = [...roles];
                      next[idx] = { ...r, description: e.target.value };
                      setRoles(next);
                    }}
                  />
                  <p className="text-[11px] text-text-muted">
                    id: {r.id}
                    {r.system ? " · system" : ""}
                    {r.isDefault ? " · default" : ""} · caps: {r.capabilities.join(", ")}
                  </p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                const id = `custom_${Date.now().toString(36)}`;
                setRoles((prev) => [
                  ...prev,
                  {
                    id,
                    label: "Custom role",
                    description: "Describe what this role can do",
                    capabilities: ["shop.browse", "orders.own"],
                  },
                ]);
              }}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
            >
              + Add custom role
            </button>
            <button
              type="button"
              onClick={() => void saveRoles()}
              className="ml-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: accent }}
            >
              Save roles
            </button>
          </div>
        )}

        {section === "admin-settings" && !staffOnly && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Shop settings</h1>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void saveSettings(new FormData(e.currentTarget));
              }}
            >
              {(
                [
                  ["brandName", "Shop name", content.brandName],
                  ["tagline", "Tagline", content.tagline],
                  ["contactPhone", "Phone", content.contactPhone],
                  ["whatsappNumber", "WhatsApp", content.whatsappNumber || ""],
                  ["openingHours", "Hours", content.openingHours || ""],
                  ["address", "Address", content.address],
                ] as const
              ).map(([name, label, val]) => (
                <label key={name} className="block text-sm">
                  <span className="mb-1 block text-xs text-text-secondary">{label}</span>
                  <input
                    name={name}
                    defaultValue={val}
                    className="w-full rounded-xl border border-border px-3 py-2"
                  />
                </label>
              ))}
              <button
                type="submit"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: accent }}
              >
                Save settings
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
