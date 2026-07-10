"use client";

/**
 * Premium multi-sided marketplace runtime (original product UI).
 * Commerce jobs of a mature marketplace — search, catalog, PDP, cart, checkout,
 * orders, returns, wish list, seller hub, ops — with Verlin Labs visual system.
 * Not a visual clone of any third-party brand.
 */

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { mockApiCall, type MockPathMode } from "@/lib/app-studio/mock-api";
import type { StudioAppSpec, StudioRole } from "@/lib/app-studio/types";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Heart,
  Home,
  LayoutGrid,
  Loader2,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";

type Product = {
  id: string;
  title: string;
  price: number;
  mrp: number;
  category: string;
  rating: number;
  reviews: number;
  express: boolean;
  status: "Active" | "Out of stock" | "Suspended";
  description: string;
  seller: string;
  badge?: string;
  hue: string;
};

type CartLine = { productId: string; qty: number };

type Order = {
  id: string;
  title: string;
  amount: number;
  status: "Placed" | "Shipped" | "Out for delivery" | "Delivered" | "Returned" | "Cancelled";
  items: string;
  eta: string;
  address: string;
};

type PageId =
  | "home"
  | "browse"
  | "pdp"
  | "cart"
  | "checkout"
  | "orders"
  | "returns"
  | "account"
  | "saved"
  | "addresses"
  | "help"
  | "deals"
  | "seller"
  | "seller-orders"
  | "seller-inventory"
  | "ops";

const CATEGORIES = [
  "All",
  "Electronics",
  "Fashion",
  "Home",
  "Books",
  "Sports",
  "Beauty",
  "Grocery",
  "Work",
] as const;

const CATALOG: Product[] = [
  {
    id: "p1",
    title: "Auralis ANC Earbuds",
    price: 2499,
    mrp: 4999,
    category: "Electronics",
    rating: 4.5,
    reviews: 2840,
    express: true,
    status: "Active",
    description: "Active noise cancel · 36h case battery · dual-device connect. Ideal for commute and focus blocks.",
    seller: "Auralis Official",
    badge: "Editor pick",
    hue: "from-sky-500/20 to-indigo-600/30",
  },
  {
    id: "p2",
    title: "StudioFlow Yoga Mat 6mm",
    price: 899,
    mrp: 1499,
    category: "Sports",
    rating: 4.3,
    reviews: 1201,
    express: true,
    status: "Active",
    description: "Non-slip TPE · light carry strap · easy wipe clean.",
    seller: "StudioFlow",
    hue: "from-emerald-400/25 to-teal-700/25",
  },
  {
    id: "p3",
    title: "DockOne USB-C Hub 7-port",
    price: 1299,
    mrp: 2499,
    category: "Work",
    rating: 4.1,
    reviews: 640,
    express: false,
    status: "Out of stock",
    description: "4K HDMI · USB 3 · SD · 100W pass-through. Restocking soon.",
    seller: "DockOne Labs",
    hue: "from-slate-400/20 to-slate-700/30",
  },
  {
    id: "p4",
    title: "Northline Insulated Bottle 1L",
    price: 599,
    mrp: 999,
    category: "Home",
    rating: 4.6,
    reviews: 3102,
    express: true,
    status: "Active",
    description: "Keeps cold 24h · hot 12h · leak-safe lid for desk and travel.",
    seller: "Northline",
    badge: "Top rated",
    hue: "from-cyan-400/20 to-blue-700/25",
  },
  {
    id: "p5",
    title: "Everyday Cotton Tee · 3 pack",
    price: 799,
    mrp: 1599,
    category: "Fashion",
    rating: 4.2,
    reviews: 980,
    express: true,
    status: "Active",
    description: "Soft mid-weight cotton · regular fit · machine wash.",
    seller: "Thread & Co.",
    hue: "from-amber-300/25 to-orange-600/20",
  },
  {
    id: "p6",
    title: "Clear Thinking · Mental Models Journal",
    price: 449,
    mrp: 699,
    category: "Books",
    rating: 4.7,
    reviews: 5200,
    express: true,
    status: "Active",
    description: "Prompted pages for decisions, second-order effects, and weekly review.",
    seller: "Horizon Press",
    badge: "Bestseller",
    hue: "from-violet-400/20 to-purple-700/25",
  },
  {
    id: "p7",
    title: "Lumen Colour Smart Bulb",
    price: 449,
    mrp: 899,
    category: "Home",
    rating: 4.4,
    reviews: 760,
    express: true,
    status: "Active",
    description: "App schedules · warm-to-cool white · voice ready.",
    seller: "Lumen Home",
    hue: "from-yellow-300/25 to-amber-600/20",
  },
  {
    id: "p8",
    title: "Hillside Raw Honey 500g",
    price: 349,
    mrp: 450,
    category: "Grocery",
    rating: 4.5,
    reviews: 420,
    express: false,
    status: "Active",
    description: "Single-origin · glass jar · no added sugar.",
    seller: "Hillside Farms",
    hue: "from-amber-200/30 to-yellow-700/20",
  },
];

const SEED_ORDERS: Order[] = [
  {
    id: "HM-10482",
    title: "Auralis ANC Earbuds",
    amount: 2499,
    status: "Shipped",
    items: "1 item",
    eta: "Arrives Thu",
    address: "Koramangala, Bengaluru 560034",
  },
  {
    id: "HM-10391",
    title: "Yoga mat + bottle",
    amount: 1498,
    status: "Delivered",
    items: "2 items",
    eta: "Delivered 12 Mar",
    address: "Koramangala, Bengaluru 560034",
  },
  {
    id: "HM-10220",
    title: "DockOne Hub",
    amount: 1299,
    status: "Returned",
    items: "1 item",
    eta: "Refund completed",
    address: "Koramangala, Bengaluru 560034",
  },
  {
    id: "HM-10501",
    title: "Cotton tee pack",
    amount: 799,
    status: "Placed",
    items: "1 item",
    eta: "Ships tomorrow",
    address: "Koramangala, Bengaluru 560034",
  },
];

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function EcomProductApp({
  spec,
  role,
  roleId,
  onRoleChange,
  fullScreen,
}: {
  spec: StudioAppSpec;
  role?: StudioRole;
  roleId: string;
  onRoleChange: (id: string) => void;
  fullScreen?: boolean;
}) {
  const brand = spec.brandName || "Horizon Market";
  const primary = spec.primaryColor || "#0f2744";
  const accent = spec.accentColor || "#0d9488";

  const [page, setPage] = useState<PageId>("home");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [products, setProducts] = useState<Product[]>(CATALOG);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [saved, setSaved] = useState<string[]>([]);
  const [pdpId, setPdpId] = useState<string | null>(null);
  const [address, setAddress] = useState("Koramangala 5th Block, Bengaluru 560034");
  const [pathMode, setPathMode] = useState<MockPathMode>("auto");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: ToastKind; msg: string } | null>(null);
  const [name, setName] = useState("Asha Sharma");
  const [phone, setPhone] = useState("9876543210");
  const [pay, setPay] = useState<"upi" | "card" | "cod">("upi");
  const [listTitle, setListTitle] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [listCat, setListCat] = useState("Electronics");
  const [menuOpen, setMenuOpen] = useState(false);

  const isSeller = /seller|merchant|vendor/i.test(`${roleId} ${role?.label || ""}`);
  const isOps = /ops|admin|support|moderator/i.test(`${roleId} ${role?.label || ""}`);

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const cartLines = cart
    .map((l) => {
      const p = products.find((x) => x.id === l.productId);
      return p ? { ...l, product: p } : null;
    })
    .filter(Boolean) as Array<CartLine & { product: Product }>;
  const cartTotal = cartLines.reduce((s, l) => s + l.product.price * l.qty, 0);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.status !== "Suspended");
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.seller.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, category, search]);

  const pdp = products.find((p) => p.id === pdpId) || null;
  const deals = products.filter((p) => p.status === "Active" && p.mrp > p.price * 1.15);

  function flash(msg: string, kind: ToastKind = "success") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3200);
  }

  function go(next: PageId) {
    setPage(next);
    setMenuOpen(false);
    if (next !== "pdp") setPdpId(null);
  }

  function openPdp(id: string) {
    setPdpId(id);
    setPage("pdp");
  }

  function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    go("browse");
    flash(search.trim() ? `Showing results for “${search.trim()}”` : "Browsing catalog", "info");
  }

  function addToCart(productId: string, qty = 1) {
    const p = products.find((x) => x.id === productId);
    if (!p || p.status !== "Active") {
      flash("This item is not available right now", "error");
      return;
    }
    setCart((prev) => {
      const hit = prev.find((l) => l.productId === productId);
      if (hit) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, qty: Math.min(10, l.qty + qty) } : l
        );
      }
      return [...prev, { productId, qty }];
    });
    flash(`Added · ${p.title}`, "success");
  }

  function setQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.productId !== productId));
      flash("Removed from bag", "info");
      return;
    }
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, qty: Math.min(10, qty) } : l))
    );
  }

  function toggleSaved(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const on = saved.includes(productId);
    setSaved((prev) => (on ? prev.filter((id) => id !== productId) : [...prev, productId]));
    flash(on ? "Removed from saved" : "Saved for later", "success");
  }

  async function placeOrder() {
    if (!cartLines.length) {
      flash("Your bag is empty — add something first", "error");
      return;
    }
    if (!name.trim()) {
      flash("Name is required", "error");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      flash("Enter a valid 10-digit phone number", "error");
      return;
    }
    if (!address.trim() || address.trim().length < 8) {
      flash("Enter a full delivery address", "error");
      return;
    }
    setBusy("checkout");
    const res = await mockApiCall({
      endpoint: "POST /marketplace/orders",
      mode: pathMode,
      payload: { cart, address, pay, name, phone },
      failMessage: "Payment could not be completed. Try another method or change sandbox mode in Account.",
      successMessage: "Order confirmed",
      onSuccess: () => {
        const id = `HM-${10000 + Math.floor(Math.random() * 90000)}`;
        const title = cartLines
          .map((l) => l.product.title)
          .slice(0, 2)
          .join(" + ");
        const order: Order = {
          id,
          title,
          amount: cartTotal,
          status: "Placed",
          items: `${cartCount} item${cartCount === 1 ? "" : "s"}`,
          eta: "Ships within 24 hours",
          address,
        };
        setOrders((prev) => [order, ...prev]);
        setCart([]);
        return order;
      },
    });
    setBusy(null);
    if (!res.ok) {
      flash(`${res.error} (${res.latencyMs}ms)`, "error");
      return;
    }
    flash(`${res.message} · ${res.data.id}`, "success");
    go("orders");
  }

  async function advanceOrder(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const flow: Order["status"][] = ["Placed", "Shipped", "Out for delivery", "Delivered"];
    const idx = flow.indexOf(order.status as (typeof flow)[number]);
    if (idx < 0 || idx >= flow.length - 1) {
      flash(
        order.status === "Delivered" ? "Already delivered" : "Status cannot move further",
        "info"
      );
      return;
    }
    const next = flow[idx + 1];
    setBusy(`ord-${id}`);
    const res = await mockApiCall({
      endpoint: `PATCH /marketplace/orders/${id}`,
      mode: pathMode,
      payload: { status: next },
      failMessage: "Could not update tracking",
      successMessage: `Now ${next}`,
      onSuccess: () => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: next,
                  eta:
                    next === "Shipped"
                      ? "In transit"
                      : next === "Out for delivery"
                        ? "Today"
                        : next === "Delivered"
                          ? "Delivered"
                          : o.eta,
                }
              : o
          )
        );
        return true;
      },
    });
    setBusy(null);
    flash(res.ok ? `${res.message} · ${res.latencyMs}ms` : res.error, res.ok ? "success" : "error");
  }

  async function requestReturn(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    if (order.status !== "Delivered" && order.status !== "Shipped") {
      flash("Only shipped or delivered orders can start a return", "error");
      return;
    }
    setBusy(`ret-${id}`);
    const res = await mockApiCall({
      endpoint: `POST /marketplace/orders/${id}/return`,
      mode: pathMode,
      payload: { id },
      failMessage: "Return not eligible for this item",
      successMessage: "Return started",
      onSuccess: () => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id ? { ...o, status: "Returned", eta: "Refund in 3–5 days" } : o
          )
        );
        return true;
      },
    });
    setBusy(null);
    flash(res.ok ? `${res.message} · ${res.latencyMs}ms` : res.error, res.ok ? "success" : "error");
  }

  async function createListing() {
    if (!isSeller && !isOps) {
      flash("Switch to Seller role to publish listings", "error");
      return;
    }
    if (!listTitle.trim()) {
      flash("Product title is required", "error");
      return;
    }
    if (!listPrice || Number(listPrice) <= 0) {
      flash("Enter a valid price", "error");
      return;
    }
    if (listTitle.toLowerCase().includes("fail")) {
      flash("Listing rejected by policy check (fail test)", "error");
      return;
    }
    setBusy("list");
    const res = await mockApiCall({
      endpoint: "POST /marketplace/listings",
      mode: pathMode,
      payload: { listTitle, listPrice, listCat },
      failMessage: "Listing failed review",
      successMessage: "Listing is live",
      onSuccess: () => {
        const p: Product = {
          id: `p-${Date.now().toString(36)}`,
          title: listTitle.trim(),
          price: Number(listPrice),
          mrp: Math.round(Number(listPrice) * 1.35),
          category: listCat,
          rating: 0,
          reviews: 0,
          express: false,
          status: "Active",
          description: "Ships from seller warehouse · quality checked",
          seller: role?.label || "Your shop",
          hue: "from-teal-400/20 to-navy/20",
        };
        setProducts((prev) => [p, ...prev]);
        setListTitle("");
        setListPrice("");
        return p;
      },
    });
    setBusy(null);
    flash(res.ok ? `${res.message} · ${res.latencyMs}ms` : res.error, res.ok ? "success" : "error");
    if (res.ok) go("seller-inventory");
  }

  const navMain: Array<{ id: PageId; label: string }> = [
    { id: "home", label: "Home" },
    { id: "browse", label: "Shop" },
    { id: "deals", label: "Deals" },
    { id: "orders", label: "Orders" },
    { id: "help", label: "Help" },
  ];
  if (isSeller) {
    navMain.push({ id: "seller", label: "Sell" });
  }
  if (isOps) {
    navMain.push({ id: "ops", label: "Ops" });
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-background text-foreground",
        fullScreen
          ? "h-full max-h-full flex-1"
          : "h-full min-h-[560px] max-h-[calc(100dvh-6rem)] rounded-xl border border-border"
      )}
    >
      {/* Premium header — original, not a third-party clone */}
      <header className="z-30 shrink-0 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 md:px-5">
          <button
            type="button"
            onClick={() => go("home")}
            className="flex items-center gap-2 rounded-xl pr-2"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
            >
              <ShoppingBag className="h-4 w-4" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-bold tracking-tight" style={{ color: primary }}>
                {brand}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Quality goods · clear returns
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => go("addresses")}
            className="hidden items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-left text-[11px] hover:border-accent-teal/40 sm:flex"
          >
            <MapPin className="h-3.5 w-3.5 text-accent-teal" />
            <span>
              <span className="block text-muted-foreground">Deliver to</span>
              <span className="font-semibold">{address.split(",")[0]}</span>
            </span>
          </button>

          <form
            onSubmit={runSearch}
            className="flex min-w-[10rem] flex-1 items-center gap-0 overflow-hidden rounded-xl border border-border bg-muted/40 focus-within:border-accent-teal/50 focus-within:ring-2 focus-within:ring-accent-teal/20"
          >
            <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${brand}…`}
              className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"
            />
            <Button type="submit" size="sm" variant="cta" className="m-1 rounded-lg">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 px-2 py-1.5">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <select
                value={roleId}
                onChange={(e) => {
                  onRoleChange(e.target.value);
                  const label =
                    spec.roles.find((r) => r.id === e.target.value)?.label || e.target.value;
                  flash(`Signed in as ${label}`, "info");
                  go("home");
                }}
                className="max-w-[7.5rem] bg-transparent text-xs font-semibold outline-none sm:max-w-[10rem] sm:text-sm"
                aria-label="Role"
              >
                {spec.roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => go("account")}
              className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground md:inline"
            >
              Account
            </button>
            <button
              type="button"
              onClick={() => go("orders")}
              className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline"
            >
              Orders
            </button>
            <button
              type="button"
              onClick={() => go("cart")}
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-border bg-accent-teal/10 px-2.5 py-1.5 text-sm font-semibold text-accent-teal hover:bg-accent-teal/15"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cta-amber px-1 text-[10px] font-bold text-navy">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category / module strip */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-border/60 bg-muted/20 px-2 py-1.5 md:px-5 [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Categories
          </button>
          {navMain.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => go(n.id)}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap",
                page === n.id
                  ? "bg-accent-teal/15 text-accent-teal"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {n.label}
            </button>
          ))}
          {CATEGORIES.filter((c) => c !== "All").map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c);
                setSearch("");
                go("browse");
              }}
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {c}
            </button>
          ))}
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-card px-3 py-3 md:px-5">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    setSearch("");
                    go("browse");
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    category === c
                      ? "border-accent-teal/40 bg-accent-teal/10 text-accent-teal"
                      : "border-border hover:border-accent-teal/30"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {toast && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-2 px-4 py-2 text-sm",
            toast.kind === "success" &&
              "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
            toast.kind === "error" &&
              "bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100",
            toast.kind === "info" &&
              "bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
          )}
          role="status"
        >
          {toast.kind === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {toast.kind === "error" && <XCircle className="h-4 w-4 shrink-0" />}
          {toast.kind === "info" && <AlertTriangle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <main
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-20 md:pb-6"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {busy && (
          <div className="flex items-center gap-2 border-b border-accent-teal/20 bg-accent-teal/5 px-4 py-2 text-xs text-accent-teal">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working… {busy}
          </div>
        )}

        {/* HOME */}
        {page === "home" && (
          <div className="mx-auto max-w-6xl space-y-6 px-3 py-5 md:px-5">
            <section
              className="overflow-hidden rounded-3xl border border-border p-6 text-white shadow-md md:p-10"
              style={{
                background: `linear-gradient(135deg, ${primary} 0%, #1e293b 50%, ${accent} 160%)`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                {role?.label || "Shopper"} · {brand}
              </p>
              <h1 className="mt-2 max-w-xl text-2xl font-bold tracking-tight md:text-4xl">
                Shop with clarity — fair prices, fast dispatch, honest returns
              </h1>
              <p className="mt-3 max-w-lg text-sm text-white/80 md:text-base">
                A full marketplace product: catalog, bag, checkout, tracking, seller tools, and
                ops. Built for demos that feel production-ready.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="cta"
                  onClick={() => {
                    setCategory("All");
                    go("browse");
                  }}
                >
                  Browse catalog <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => go("deals")}
                >
                  <Sparkles className="h-4 w-4" /> Today&apos;s deals
                </Button>
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Truck, t: "Express delivery", d: "On eligible items — clear ETA on every order" },
                { icon: ShieldCheck, t: "Buyer protection", d: "Easy returns on delivered orders" },
                { icon: Store, t: "Verified sellers", d: "Seller hub for listings and fulfilment" },
              ].map((x) => (
                <Card key={x.t} className="flex gap-3 p-4">
                  <x.icon className="h-5 w-5 shrink-0 text-accent-teal" />
                  <div>
                    <p className="text-sm font-semibold">{x.t}</p>
                    <p className="text-xs text-muted-foreground">{x.d}</p>
                  </div>
                </Card>
              ))}
            </div>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Shop by category</h2>
                <button
                  type="button"
                  className="text-sm font-medium text-accent-teal hover:underline"
                  onClick={() => go("browse")}
                >
                  View all
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCategory(c);
                      go("browse");
                    }}
                    className="rounded-2xl border border-border bg-card p-4 text-left transition hover:border-accent-teal/40 hover:shadow-sm"
                  >
                    <p className="font-semibold">{c}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {products.filter((p) => p.category === c).length} products
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Featured deals</h2>
                <button
                  type="button"
                  className="text-sm font-medium text-accent-teal hover:underline"
                  onClick={() => go("deals")}
                >
                  All deals
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {deals.slice(0, 4).map((p) => (
                  <ProductTile
                    key={p.id}
                    product={p}
                    saved={saved.includes(p.id)}
                    onOpen={() => openPdp(p.id)}
                    onAdd={() => addToCart(p.id)}
                    onSave={() => toggleSaved(p.id)}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Recommended for you</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {products
                  .filter((p) => p.status === "Active")
                  .map((p) => (
                    <ProductTile
                      key={p.id}
                      product={p}
                      saved={saved.includes(p.id)}
                      onOpen={() => openPdp(p.id)}
                      onAdd={() => addToCart(p.id)}
                      onSave={() => toggleSaved(p.id)}
                    />
                  ))}
              </div>
            </section>
          </div>
        )}

        {/* BROWSE / DEALS */}
        {(page === "browse" || page === "deals") && (
          <div className="mx-auto grid max-w-6xl gap-4 px-3 py-5 md:grid-cols-[200px_1fr] md:px-5">
            <aside className="h-fit space-y-1 rounded-2xl border border-border bg-card p-3">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Filters
              </p>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "w-full rounded-lg px-2.5 py-2 text-left text-sm",
                    category === c
                      ? "bg-accent-teal/15 font-semibold text-accent-teal"
                      : "hover:bg-muted"
                  )}
                >
                  {c}
                </button>
              ))}
              <div className="mt-3 border-t border-border px-2 pt-3 text-xs text-muted-foreground">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    onChange={(e) => {
                      if (e.target.checked) go("deals");
                      else go("browse");
                    }}
                    checked={page === "deals"}
                  />
                  On sale only
                </label>
              </div>
            </aside>
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                {page === "deals" ? "Deals" : "Catalog"}
                {category !== "All" ? ` · ${category}` : ""}
                {search ? ` · “${search}”` : ""} ·{" "}
                {(page === "deals" ? filtered.filter((p) => p.mrp > p.price * 1.15) : filtered)
                  .length}{" "}
                results
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(page === "deals"
                  ? filtered.filter((p) => p.mrp > p.price * 1.15)
                  : filtered
                ).map((p) => (
                  <ProductTile
                    key={p.id}
                    product={p}
                    saved={saved.includes(p.id)}
                    onOpen={() => openPdp(p.id)}
                    onAdd={() => addToCart(p.id)}
                    onSave={() => toggleSaved(p.id)}
                  />
                ))}
              </div>
              {(page === "deals"
                ? filtered.filter((p) => p.mrp > p.price * 1.15)
                : filtered
              ).length === 0 && (
                <Card className="p-8 text-center">
                  <p className="font-medium">No products match</p>
                  <Button
                    type="button"
                    className="mt-3"
                    variant="secondary"
                    onClick={() => {
                      setSearch("");
                      setCategory("All");
                      go("browse");
                    }}
                  >
                    Clear filters
                  </Button>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* PDP */}
        {page === "pdp" && pdp && (
          <div className="mx-auto grid max-w-5xl gap-6 px-3 py-5 md:grid-cols-2 md:px-5">
            <div
              className={cn(
                "flex min-h-[280px] items-center justify-center rounded-3xl bg-gradient-to-br p-8",
                pdp.hue
              )}
            >
              <Package className="h-24 w-24 text-navy/30" />
            </div>
            <div className="space-y-4">
              {pdp.badge && (
                <Badge className="bg-accent-teal/15 text-accent-teal">{pdp.badge}</Badge>
              )}
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{pdp.title}</h1>
              <p className="text-sm text-muted-foreground">
                {pdp.rating.toFixed(1)} ★ · {pdp.reviews.toLocaleString()} reviews · Sold by{" "}
                <strong className="text-foreground">{pdp.seller}</strong>
              </p>
              <div>
                <p className="text-3xl font-bold">{inr(pdp.price)}</p>
                <p className="text-sm text-muted-foreground">
                  MRP <span className="line-through">{inr(pdp.mrp)}</span> ·{" "}
                  {Math.round((1 - pdp.price / pdp.mrp) * 100)}% off
                </p>
              </div>
              {pdp.express && (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-teal">
                  <Zap className="h-4 w-4" /> Horizon Express · next-day on this pin
                </p>
              )}
              <p className="text-sm leading-relaxed text-muted-foreground">{pdp.description}</p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  pdp.status === "Active" ? "text-emerald-700" : "text-red-600"
                )}
              >
                {pdp.status === "Active" ? "In stock" : pdp.status}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="cta"
                  disabled={pdp.status !== "Active"}
                  onClick={() => addToCart(pdp.id)}
                >
                  Add to bag
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pdp.status !== "Active"}
                  onClick={() => {
                    addToCart(pdp.id);
                    go("checkout");
                  }}
                >
                  Buy now
                </Button>
                <Button type="button" variant="secondary" onClick={() => toggleSaved(pdp.id)}>
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      saved.includes(pdp.id) && "fill-red-500 text-red-500"
                    )}
                  />
                  Save
                </Button>
              </div>
              <Card className="space-y-1 border-dashed p-4 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" /> Deliver to {address.split(",")[0]}
                </p>
                <button
                  type="button"
                  className="text-accent-teal hover:underline"
                  onClick={() => go("addresses")}
                >
                  Change address
                </button>
              </Card>
            </div>
          </div>
        )}

        {/* CART */}
        {page === "cart" && (
          <div className="mx-auto grid max-w-5xl gap-4 px-3 py-5 lg:grid-cols-[1fr_300px] md:px-5">
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">Your bag</h1>
              {!cartLines.length && (
                <Card className="p-10 text-center">
                  <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 font-medium">Bag is empty</p>
                  <Button type="button" className="mt-3" variant="cta" onClick={() => go("browse")}>
                    Continue shopping
                  </Button>
                </Card>
              )}
              {cartLines.map((l) => (
                <Card key={l.productId} className="flex flex-wrap gap-4 p-4">
                  <div
                    className={cn(
                      "flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br",
                      l.product.hue
                    )}
                  >
                    <Package className="h-8 w-8 text-navy/40" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="text-left font-semibold hover:text-accent-teal"
                      onClick={() => openPdp(l.productId)}
                    >
                      {l.product.title}
                    </button>
                    <p className="text-sm font-bold">{inr(l.product.price)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <select
                        value={l.qty}
                        onChange={(e) => setQty(l.productId, Number(e.target.value))}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                      >
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n === 0 ? "Remove" : `Qty ${n}`}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="text-xs text-accent-teal hover:underline"
                        onClick={() => toggleSaved(l.productId)}
                      >
                        Save for later
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => setQty(l.productId, 0)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-bold">{inr(l.product.price * l.qty)}</p>
                </Card>
              ))}
            </div>
            <Card className="h-fit space-y-3 p-5">
              <p className="text-sm text-muted-foreground">
                Subtotal · {cartCount} item{cartCount === 1 ? "" : "s"}
              </p>
              <p className="text-2xl font-bold">{inr(cartTotal)}</p>
              <Button
                type="button"
                variant="cta"
                className="w-full"
                disabled={!cartLines.length}
                onClick={() => go("checkout")}
              >
                Checkout
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => go("browse")}
              >
                Keep shopping
              </Button>
            </Card>
          </div>
        )}

        {/* CHECKOUT */}
        {page === "checkout" && (
          <div className="mx-auto max-w-xl space-y-4 px-3 py-5 md:px-5">
            <h1 className="text-2xl font-bold">Checkout</h1>
            {!cartLines.length ? (
              <Card className="p-6 text-center">
                <p>Nothing to checkout</p>
                <Button type="button" className="mt-3" onClick={() => go("browse")}>
                  Shop now
                </Button>
              </Card>
            ) : (
              <>
                <Card className="space-y-3 p-5">
                  <h2 className="font-semibold">1 · Delivery</h2>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                  />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone"
                  />
                  <textarea
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address"
                  />
                </Card>
                <Card className="space-y-2 p-5">
                  <h2 className="font-semibold">2 · Payment</h2>
                  {(
                    [
                      ["upi", "UPI"],
                      ["card", "Card"],
                      ["cod", "Cash on delivery"],
                    ] as const
                  ).map(([id, label]) => (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-accent-teal/40"
                    >
                      <input
                        type="radio"
                        name="pay"
                        checked={pay === id}
                        onChange={() => setPay(id)}
                      />
                      {label}
                    </label>
                  ))}
                </Card>
                <Card className="space-y-2 p-5">
                  <h2 className="font-semibold">3 · Review</h2>
                  {cartLines.map((l) => (
                    <p key={l.productId} className="text-sm text-muted-foreground">
                      {l.qty}× {l.product.title} — {inr(l.product.price * l.qty)}
                    </p>
                  ))}
                  <p className="pt-2 text-xl font-bold">Total {inr(cartTotal)}</p>
                  <Button
                    type="button"
                    variant="cta"
                    className="w-full"
                    disabled={Boolean(busy)}
                    onClick={() => void placeOrder()}
                  >
                    {busy === "checkout" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Place order
                  </Button>
                </Card>
              </>
            )}
          </div>
        )}

        {/* ORDERS */}
        {page === "orders" && (
          <div className="mx-auto max-w-3xl space-y-3 px-3 py-5 md:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-bold">Your orders</h1>
              <Button type="button" size="sm" variant="secondary" onClick={() => go("returns")}>
                Returns
              </Button>
            </div>
            {orders.map((o) => (
              <Card key={o.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{o.id}</p>
                    <p className="font-semibold">{o.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {o.items} · {inr(o.amount)} · {o.eta}
                    </p>
                    <Badge
                      className={cn(
                        "mt-2",
                        o.status === "Delivered" && "bg-emerald-100 text-emerald-800",
                        o.status === "Returned" && "bg-amber-100 text-amber-900",
                        o.status === "Placed" && "bg-sky-100 text-sky-900"
                      )}
                    >
                      {o.status}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void advanceOrder(o.id)}
                    >
                      Update tracking
                    </Button>
                    {(o.status === "Delivered" || o.status === "Shipped") && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void requestReturn(o.id)}
                      >
                        Start return
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => go("help")}
                    >
                      Get help
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {page === "returns" && (
          <div className="mx-auto max-w-xl space-y-3 px-3 py-5 md:px-5">
            <h1 className="text-2xl font-bold">Returns</h1>
            {orders
              .filter((o) => o.status === "Returned" || o.status === "Delivered")
              .map((o) => (
                <Card key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{o.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.id} · {o.status}
                    </p>
                  </div>
                  {o.status === "Delivered" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="cta"
                      onClick={() => void requestReturn(o.id)}
                    >
                      Return
                    </Button>
                  ) : (
                    <Badge className="bg-muted">In progress</Badge>
                  )}
                </Card>
              ))}
            <Button type="button" variant="secondary" onClick={() => go("orders")}>
              Back to orders
            </Button>
          </div>
        )}

        {page === "saved" && (
          <div className="mx-auto max-w-5xl space-y-3 px-3 py-5 md:px-5">
            <h1 className="text-2xl font-bold">Saved items</h1>
            {!saved.length && (
              <Card className="p-8 text-center">
                <p>Nothing saved yet</p>
                <Button type="button" className="mt-3" variant="cta" onClick={() => go("browse")}>
                  Explore products
                </Button>
              </Card>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((id) => {
                const p = products.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <ProductTile
                    key={id}
                    product={p}
                    saved
                    onOpen={() => openPdp(id)}
                    onAdd={() => addToCart(id)}
                    onSave={() => toggleSaved(id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {page === "addresses" && (
          <div className="mx-auto max-w-md space-y-3 px-3 py-5 md:px-5">
            <h1 className="text-2xl font-bold">Delivery address</h1>
            <Card className="space-y-3 p-5">
              <textarea
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                rows={4}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Button
                type="button"
                variant="cta"
                onClick={() => {
                  if (address.trim().length < 8) {
                    flash("Enter a fuller address", "error");
                    return;
                  }
                  flash("Address saved", "success");
                  go("home");
                }}
              >
                Save address
              </Button>
            </Card>
          </div>
        )}

        {page === "account" && (
          <div className="mx-auto max-w-3xl space-y-4 px-3 py-5 md:px-5">
            <h1 className="text-2xl font-bold">Account</h1>
            <p className="text-sm text-muted-foreground">
              Signed in as <strong className="text-foreground">{role?.label}</strong>
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["orders", "Orders", "Track and manage"],
                  ["saved", "Saved", "Wish list"],
                  ["addresses", "Addresses", "Delivery locations"],
                  ["help", "Help", "Support options"],
                  ["cart", "Bag", `${cartCount} items`],
                  ["home", "Home", "Continue shopping"],
                ] as const
              ).map(([id, title, sub]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => go(id)}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-left hover:border-accent-teal/40"
                >
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="text-xs text-muted-foreground">{sub}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
            <Card className="space-y-2 p-5">
              <p className="font-semibold">Sandbox controls</p>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={pathMode}
                onChange={(e) => {
                  setPathMode(e.target.value as MockPathMode);
                  flash(`API path: ${e.target.value}`, "info");
                }}
              >
                <option value="auto">Realistic (auto)</option>
                <option value="always_ok">Always succeed</option>
                <option value="always_fail">Always fail</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Use Always fail, then try Place order, to rehearse payment errors.
              </p>
            </Card>
          </div>
        )}

        {page === "help" && (
          <div className="mx-auto max-w-lg space-y-3 px-3 py-5 md:px-5">
            <h1 className="text-2xl font-bold">Help centre</h1>
            {[
              ["Track an order", "orders"],
              ["Start a return", "returns"],
              ["Update address", "addresses"],
              ["Payment help", "account"],
            ].map(([label, id]) => (
              <button
                key={label}
                type="button"
                onClick={() => go(id as PageId)}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-medium hover:border-accent-teal/40"
              >
                {label}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
            <Button
              type="button"
              variant="cta"
              onClick={() => flash("Support request submitted (demo)", "success")}
            >
              Contact support
            </Button>
          </div>
        )}

        {/* SELLER */}
        {(page === "seller" || page === "seller-inventory" || page === "seller-orders") && (
          <div className="mx-auto max-w-3xl space-y-4 px-3 py-5 md:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-bold">Seller hub</h1>
              <div className="flex gap-1">
                {(
                  [
                    ["seller", "New listing"],
                    ["seller-inventory", "Inventory"],
                    ["seller-orders", "Orders"],
                  ] as const
                ).map(([id, label]) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={page === id ? "cta" : "secondary"}
                    onClick={() => go(id)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            {!isSeller && (
              <Card className="border-amber-300/50 bg-amber-50/50 p-4 text-sm dark:bg-amber-950/20">
                Switch role to <strong>Seller</strong> in the header for full listing rights.
              </Card>
            )}
            {page === "seller" && (
              <Card className="space-y-3 p-5">
                <h2 className="font-semibold">Create listing</h2>
                <Input
                  placeholder="Product title"
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    type="number"
                    placeholder="Price ₹"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                  />
                  <select
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={listCat}
                    onChange={(e) => setListCat(e.target.value)}
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="cta"
                  disabled={Boolean(busy)}
                  onClick={() => void createListing()}
                >
                  {busy === "list" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Publish listing
                </Button>
              </Card>
            )}
            {page === "seller-inventory" && (
              <div className="space-y-2">
                {products.map((p) => (
                  <Card
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3"
                  >
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.category} · {inr(p.price)} · {p.seller}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-muted">{p.status}</Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setProducts((prev) =>
                            prev.map((x) =>
                              x.id === p.id
                                ? {
                                    ...x,
                                    status: x.status === "Active" ? "Out of stock" : "Active",
                                  }
                                : x
                            )
                          );
                          flash("Inventory updated", "success");
                        }}
                      >
                        Toggle stock
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {page === "seller-orders" && (
              <div className="space-y-2">
                {orders.map((o) => (
                  <Card
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {o.id} · {o.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.status} · {inr(o.amount)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="cta"
                      onClick={() => void advanceOrder(o.id)}
                    >
                      Advance fulfilment
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {page === "ops" && (
          <div className="mx-auto max-w-3xl space-y-3 px-3 py-5 md:px-5">
            <h1 className="text-2xl font-bold">Ops desk</h1>
            <p className="text-sm text-muted-foreground">
              Reinstate listings and review returns — marketplace trust & safety surface.
            </p>
            {products
              .filter((p) => p.status !== "Active")
              .map((p) => (
                <Card key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <span>
                    {p.title} · <Badge className="bg-muted">{p.status}</Badge>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="cta"
                    onClick={() => {
                      setProducts((prev) =>
                        prev.map((x) => (x.id === p.id ? { ...x, status: "Active" } : x))
                      );
                      flash("Listing reinstated", "success");
                    }}
                  >
                    Reinstate
                  </Button>
                </Card>
              ))}
            {orders
              .filter((o) => o.status === "Returned" || o.status === "Cancelled")
              .map((o) => (
                <Card key={o.id} className="p-3 text-sm">
                  {o.id} · {o.title} · {o.status}
                </Card>
              ))}
            {!products.some((p) => p.status !== "Active") && (
              <Card className="p-4 text-sm text-muted-foreground">
                No suspended listings right now. Toggle stock as Seller to create ops work.
              </Card>
            )}
          </div>
        )}

        {/* Footer — original brand, compact */}
        <footer className="mt-10 border-t border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4 md:px-5">
            <div>
              <p className="text-sm font-bold" style={{ color: primary }}>
                {brand}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Premium multi-sided marketplace demo. Clear jobs, honest status, mock payments.
              </p>
            </div>
            <FooterCol
              title="Shop"
              links={[
                ["Browse", () => go("browse")],
                ["Deals", () => go("deals")],
                ["Bag", () => go("cart")],
              ]}
            />
            <FooterCol
              title="Orders"
              links={[
                ["Your orders", () => go("orders")],
                ["Returns", () => go("returns")],
                ["Help", () => go("help")],
              ]}
            />
            <FooterCol
              title="Partners"
              links={[
                ["Seller hub", () => go("seller")],
                ["Inventory", () => go("seller-inventory")],
                ["Ops desk", () => go("ops")],
              ]}
            />
          </div>
          <div className="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} {brand}. Interactive demo — no real payments or shipping.
          </div>
        </footer>
      </main>

      {/* Mobile nav */}
      <nav className="flex shrink-0 border-t border-border bg-card md:hidden">
        {(
          [
            ["home", "Home", Home],
            ["browse", "Shop", LayoutGrid],
            ["orders", "Orders", Package],
            ["cart", "Bag", ShoppingCart],
            ["account", "You", UserRound],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              page === id ? "text-accent-teal" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {id === "cart" && cartCount > 0 && (
              <span className="absolute top-1 right-[28%] flex h-4 min-w-4 items-center justify-center rounded-full bg-cta-amber px-0.5 text-[9px] font-bold text-navy">
                {cartCount}
              </span>
            )}
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<[string, () => void]>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="mt-2 space-y-1">
        {links.map(([label, onClick]) => (
          <li key={label}>
            <button
              type="button"
              onClick={onClick}
              className="text-sm text-foreground/80 hover:text-accent-teal"
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductTile({
  product,
  saved,
  onOpen,
  onAdd,
  onSave,
}: {
  product: Product;
  saved?: boolean;
  onOpen: () => void;
  onAdd: () => void;
  onSave: () => void;
}) {
  const off = Math.round((1 - product.price / product.mrp) * 100);
  return (
    <Card className="flex flex-col overflow-hidden p-0 transition hover:border-accent-teal/40 hover:shadow-md">
      <button type="button" onClick={onOpen} className="text-left">
        <div
          className={cn(
            "relative flex h-36 items-center justify-center bg-gradient-to-br",
            product.hue
          )}
        >
          <Package className="h-14 w-14 text-navy/25" />
          {product.badge && (
            <span className="absolute top-2 left-2 rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-bold text-accent-teal shadow-sm">
              {product.badge}
            </span>
          )}
          {off >= 15 && (
            <span className="absolute top-2 right-2 rounded-full bg-cta-amber px-2 py-0.5 text-[10px] font-bold text-navy">
              -{off}%
            </span>
          )}
        </div>
        <div className="space-y-1 p-3">
          <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.title}</p>
          <p className="text-xs text-muted-foreground">
            {product.rating.toFixed(1)} ★ · {product.reviews.toLocaleString()}
          </p>
          <p className="text-base font-bold">
            {inr(product.price)}{" "}
            <span className="text-xs font-normal text-muted-foreground line-through">
              {inr(product.mrp)}
            </span>
          </p>
          {product.express && (
            <p className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-accent-teal">
              <Zap className="h-3 w-3" /> Express
            </p>
          )}
        </div>
      </button>
      <div className="mt-auto flex gap-1.5 border-t border-border p-2">
        <Button
          type="button"
          size="sm"
          variant="cta"
          className="h-8 flex-1 text-xs"
          disabled={product.status !== "Active"}
          onClick={onAdd}
        >
          Add
        </Button>
        <Button type="button" size="sm" variant="secondary" className="h-8 px-2" onClick={onSave}>
          <Heart className={cn("h-3.5 w-3.5", saved && "fill-red-500 text-red-500")} />
        </Button>
      </div>
    </Card>
  );
}
