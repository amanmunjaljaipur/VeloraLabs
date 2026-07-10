"use client";

/**
 * Amazon-style mass marketplace product runtime.
 * IA mirrors Amazon web/app: top utility bar, search, account/orders/cart,
 * department strip, home rails, PDP, cart, checkout, orders, returns, seller central.
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
  CheckCircle2,
  ChevronDown,
  Heart,
  Home,
  Loader2,
  MapPin,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Star,
  Store,
  Truck,
  UserRound,
  XCircle,
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
  prime: boolean;
  status: "Active" | "Out of stock" | "Suspended";
  description: string;
  seller: string;
  badge?: string;
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
  | "search"
  | "pdp"
  | "cart"
  | "checkout"
  | "orders"
  | "returns"
  | "account"
  | "lists"
  | "addresses"
  | "customer-service"
  | "departments"
  | "deals"
  | "seller"
  | "seller-orders"
  | "seller-inventory"
  | "ops";

const DEPARTMENTS = [
  "All",
  "Electronics",
  "Computers",
  "Smart Home",
  "Arts & Crafts",
  "Automotive",
  "Baby",
  "Beauty",
  "Fashion",
  "Health",
  "Home & Kitchen",
  "Books",
  "Sports",
  "Toys",
  "Grocery",
] as const;

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p1",
    title: "Noise Cancelling Wireless Earbuds Pro",
    price: 2499,
    mrp: 4999,
    category: "Electronics",
    rating: 4.4,
    reviews: 12840,
    prime: true,
    status: "Active",
    description: "40hr battery · IPX5 · dual device connect. Fulfilled by marketplace.",
    seller: "AudioHub Official",
    badge: "Best seller",
  },
  {
    id: "p2",
    title: "Premium Yoga Mat 6mm Anti-Slip",
    price: 899,
    mrp: 1499,
    category: "Sports",
    rating: 4.2,
    reviews: 3201,
    prime: true,
    status: "Active",
    description: "Non-slip TPE · carry strap · eco-friendly.",
    seller: "FitLife Store",
  },
  {
    id: "p3",
    title: "USB-C 7-in-1 Hub HDMI 4K",
    price: 1299,
    mrp: 2499,
    category: "Computers",
    rating: 4.1,
    reviews: 890,
    prime: false,
    status: "Out of stock",
    description: "HDMI · USB 3.0 · SD · 100W PD pass-through.",
    seller: "GadgetNest",
  },
  {
    id: "p4",
    title: "Stainless Steel Water Bottle 1L",
    price: 599,
    mrp: 999,
    category: "Home & Kitchen",
    rating: 4.6,
    reviews: 5402,
    prime: true,
    status: "Active",
    description: "Hot 12h · cold 24h · leak-proof lid.",
    seller: "DailyHome",
    badge: "Amazon's Choice",
  },
  {
    id: "p5",
    title: "Cotton Crew T-Shirt Pack of 3",
    price: 799,
    mrp: 1599,
    category: "Fashion",
    rating: 4.0,
    reviews: 2100,
    prime: true,
    status: "Active",
    description: "100% cotton · regular fit · machine wash.",
    seller: "Basics Co.",
  },
  {
    id: "p6",
    title: "Atomic Habits (Paperback)",
    price: 399,
    mrp: 599,
    category: "Books",
    rating: 4.7,
    reviews: 45200,
    prime: true,
    status: "Active",
    description: "International bestseller · clear habits framework.",
    seller: "BookWorld",
    badge: "#1 in Self-Help",
  },
  {
    id: "p7",
    title: "Smart LED Bulb 9W Colour",
    price: 449,
    mrp: 899,
    category: "Smart Home",
    rating: 4.3,
    reviews: 1560,
    prime: true,
    status: "Active",
    description: "App + voice · 16M colours · schedules.",
    seller: "HomeSense",
  },
  {
    id: "p8",
    title: "Organic Honey 500g",
    price: 349,
    mrp: 450,
    category: "Grocery",
    rating: 4.5,
    reviews: 980,
    prime: false,
    status: "Active",
    description: "Raw · unprocessed · glass jar.",
    seller: "FarmDirect",
  },
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "ORD-10482",
    title: "Wireless Earbuds Pro",
    amount: 2499,
    status: "Shipped",
    items: "1 item",
    eta: "Arriving Thu",
    address: "Koramangala, Bengaluru 560034",
  },
  {
    id: "ORD-10391",
    title: "Yoga Mat + Water Bottle",
    amount: 1498,
    status: "Delivered",
    items: "2 items",
    eta: "Delivered 12 Mar",
    address: "Koramangala, Bengaluru 560034",
  },
  {
    id: "ORD-10220",
    title: "USB-C Hub",
    amount: 1299,
    status: "Returned",
    items: "1 item",
    eta: "Refund processed",
    address: "Koramangala, Bengaluru 560034",
  },
  {
    id: "ORD-10501",
    title: "T-Shirt Pack",
    amount: 799,
    status: "Placed",
    items: "1 item",
    eta: "Dispatch by tomorrow",
    address: "Koramangala, Bengaluru 560034",
  },
];

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function stars(n: number) {
  const full = Math.round(n);
  return "★".repeat(Math.min(5, full)) + "☆".repeat(Math.max(0, 5 - full));
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
  const brand = spec.brandName || "Market";
  const primary = spec.primaryColor || "#131921";
  const accent = spec.accentColor || "#febd69";

  const [page, setPage] = useState<PageId>("home");
  const [deptOpen, setDeptOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDept, setSearchDept] = useState("All");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>(DEFAULT_ORDERS);
  const [lists, setLists] = useState<string[]>([]);
  const [pdpId, setPdpId] = useState<string | null>(null);
  const [address, setAddress] = useState("Koramangala 5th Block, Bengaluru 560034");
  const [pathMode, setPathMode] = useState<MockPathMode>("auto");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: ToastKind; msg: string } | null>(null);
  const [checkoutName, setCheckoutName] = useState("Asha Sharma");
  const [checkoutPhone, setCheckoutPhone] = useState("9876543210");
  const [payMethod, setPayMethod] = useState<"upi" | "card" | "cod">("upi");
  const [listProductTitle, setListProductTitle] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [listCategory, setListCategory] = useState("Electronics");

  const isSeller = /seller|merchant|vendor/i.test(roleId) || /seller|merchant/i.test(role?.label || "");
  const isOps = /ops|admin|support|moderator/i.test(roleId) || /ops|admin|support/i.test(role?.label || "");

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
    if (activeCategory !== "All") list = list.filter((p) => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (searchDept !== "All" && page === "search") {
      list = list.filter((p) => p.category === searchDept || searchDept === "All");
    }
    return list;
  }, [products, activeCategory, search, searchDept, page]);

  const pdp = products.find((p) => p.id === pdpId) || null;

  function flash(msg: string, kind: ToastKind = "success") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3200);
  }

  function go(pageId: PageId) {
    setPage(pageId);
    setDeptOpen(false);
    if (pageId !== "pdp") setPdpId(null);
  }

  function openPdp(id: string) {
    setPdpId(id);
    setPage("pdp");
  }

  function runSearch() {
    setPage("search");
    setActiveCategory(searchDept === "All" ? "All" : searchDept);
    flash(search.trim() ? `Results for “${search.trim()}”` : "Browsing all products", "info");
  }

  function addToCart(productId: string, qty = 1) {
    const p = products.find((x) => x.id === productId);
    if (!p || p.status !== "Active") {
      flash("Item unavailable", "error");
      return;
    }
    setCart((prev) => {
      const hit = prev.find((l) => l.productId === productId);
      if (hit) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, qty: l.qty + qty } : l
        );
      }
      return [...prev, { productId, qty }];
    });
    flash(`Added to cart · ${p.title}`, "success");
  }

  function setQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.productId !== productId));
      flash("Removed from cart", "info");
      return;
    }
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, qty } : l))
    );
  }

  function toggleList(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setLists((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
    flash(
      lists.includes(productId) ? "Removed from Wish List" : "Saved to Wish List",
      "success"
    );
  }

  async function placeOrder() {
    if (!cartLines.length) {
      flash("Your cart is empty", "error");
      return;
    }
    if (!checkoutName.trim() || checkoutPhone.replace(/\D/g, "").length < 10) {
      flash("Enter a valid name and 10-digit phone", "error");
      return;
    }
    if (!address.trim()) {
      flash("Delivery address is required", "error");
      return;
    }
    setBusy("checkout");
    const res = await mockApiCall({
      endpoint: "POST /orders",
      mode: pathMode,
      payload: { cart, address, payMethod, checkoutName },
      failMessage: "Payment failed — try another method or Always succeed in Account",
      successMessage: "Order placed",
      onSuccess: () => {
        const id = `ORD-${10000 + Math.floor(Math.random() * 90000)}`;
        const title = cartLines.map((l) => l.product.title).slice(0, 2).join(" + ");
        const order: Order = {
          id,
          title,
          amount: cartTotal,
          status: "Placed",
          items: `${cartCount} item${cartCount > 1 ? "s" : ""}`,
          eta: "Dispatch by tomorrow",
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
    const flow: Order["status"][] = [
      "Placed",
      "Shipped",
      "Out for delivery",
      "Delivered",
    ];
    const idx = flow.indexOf(order.status as (typeof flow)[number]);
    if (idx < 0 || idx >= flow.length - 1) {
      if (order.status === "Delivered") flash("Already delivered", "info");
      else flash("Cannot advance this status", "info");
      return;
    }
    const next = flow[idx + 1];
    setBusy(`ord-${id}`);
    const res = await mockApiCall({
      endpoint: `PATCH /orders/${id}`,
      mode: pathMode,
      payload: { status: next },
      failMessage: "Status update failed",
      successMessage: `Order → ${next}`,
      onSuccess: () => {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: next, eta: next } : o))
        );
        return true;
      },
    });
    setBusy(null);
    flash(
      res.ok ? `${res.message} · ${res.latencyMs}ms` : `${res.error}`,
      res.ok ? "success" : "error"
    );
  }

  async function requestReturn(id: string) {
    setBusy(`ret-${id}`);
    const res = await mockApiCall({
      endpoint: `POST /orders/${id}/return`,
      mode: pathMode,
      payload: { id },
      failMessage: "Return window closed or item not eligible",
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
    flash(
      res.ok ? `${res.message} · ${res.latencyMs}ms` : `${res.error}`,
      res.ok ? "success" : "error"
    );
  }

  async function createListing() {
    if (!listProductTitle.trim() || !listPrice || Number(listPrice) <= 0) {
      flash("Title and valid price required", "error");
      return;
    }
    if (listProductTitle.toLowerCase().includes("fail")) {
      flash("Listing rejected (fail test)", "error");
      return;
    }
    setBusy("list");
    const res = await mockApiCall({
      endpoint: "POST /seller/listings",
      mode: pathMode,
      payload: { listProductTitle, listPrice, listCategory },
      failMessage: "Listing failed compliance check",
      successMessage: "Listing live",
      onSuccess: () => {
        const p: Product = {
          id: `p-${Date.now().toString(36)}`,
          title: listProductTitle.trim(),
          price: Number(listPrice),
          mrp: Math.round(Number(listPrice) * 1.4),
          category: listCategory,
          rating: 0,
          reviews: 0,
          prime: false,
          status: "Active",
          description: "Seller listing · ships from India",
          seller: role?.label || "Your store",
        };
        setProducts((prev) => [p, ...prev]);
        setListProductTitle("");
        setListPrice("");
        return p;
      },
    });
    setBusy(null);
    flash(
      res.ok ? `${res.message} · ${res.latencyMs}ms` : `${res.error}`,
      res.ok ? "success" : "error"
    );
  }

  const topCats = [
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Books",
    "Sports",
    "Grocery",
    "Smart Home",
    "Computers",
  ];

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-[#eaeded] text-[#0f1111]",
        fullScreen ? "h-full max-h-full flex-1" : "h-full min-h-[560px] max-h-[calc(100dvh-6rem)] rounded-xl border border-border"
      )}
    >
      {/* ═══ Amazon-style top chrome ═══ */}
      <header className="shrink-0 text-white" style={{ background: primary }}>
        {/* Row 1: logo · location · search · account · orders · cart */}
        <div className="flex flex-wrap items-center gap-2 px-2 py-2 md:px-3">
          <button
            type="button"
            onClick={() => go("home")}
            className="flex items-center gap-1 rounded px-2 py-1 hover:outline hover:outline-1 hover:outline-white"
          >
            <Store className="h-6 w-6" style={{ color: accent }} />
            <span className="text-lg font-bold tracking-tight">
              {brand}
              <span className="text-[10px] font-normal">.in</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => go("addresses")}
            className="hidden max-w-[9rem] rounded px-2 py-1 text-left text-[11px] leading-tight hover:outline hover:outline-1 hover:outline-white sm:block"
          >
            <span className="block text-white/70">Deliver to</span>
            <span className="flex items-center gap-0.5 font-bold">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{address.split(",")[0]}</span>
            </span>
          </button>

          {/* Search — dominant like Amazon */}
          <form
            className="flex min-w-[12rem] flex-1 items-stretch overflow-hidden rounded-md"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch();
            }}
          >
            <select
              value={searchDept}
              onChange={(e) => setSearchDept(e.target.value)}
              className="hidden bg-[#e6e6e6] px-2 text-[11px] text-black sm:block"
              aria-label="Search department"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${brand}`}
              className="min-w-0 flex-1 px-3 py-2 text-sm text-black outline-none"
            />
            <button
              type="submit"
              className="flex items-center justify-center px-3 text-black"
              style={{ background: accent }}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-1 rounded border border-white/30 px-2 py-1 text-[11px] lg:flex">
              <span className="text-white/70">Role</span>
              <select
                value={roleId}
                onChange={(e) => {
                  onRoleChange(e.target.value);
                  flash(`Signed in as ${e.target.options[e.target.selectedIndex].text}`, "info");
                  go("home");
                }}
                className="max-w-[8rem] bg-transparent font-bold outline-none"
              >
                {spec.roles.map((r) => (
                  <option key={r.id} value={r.id} className="text-black">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => go("account")}
              className="rounded px-2 py-1 text-left text-[11px] leading-tight hover:outline hover:outline-1 hover:outline-white"
            >
              <span className="block text-white/70">Hello, {role?.label || "Guest"}</span>
              <span className="font-bold">Account & Lists</span>
            </button>

            <button
              type="button"
              onClick={() => go("orders")}
              className="hidden rounded px-2 py-1 text-left text-[11px] leading-tight hover:outline hover:outline-1 hover:outline-white sm:block"
            >
              <span className="block text-white/70">Returns</span>
              <span className="font-bold">& Orders</span>
            </button>

            <button
              type="button"
              onClick={() => go("cart")}
              className="relative flex items-end gap-1 rounded px-2 py-1 hover:outline hover:outline-1 hover:outline-white"
            >
              <ShoppingCart className="h-7 w-7" />
              <span
                className="absolute top-0 left-5 text-sm font-bold"
                style={{ color: accent }}
              >
                {cartCount}
              </span>
              <span className="hidden text-sm font-bold sm:inline">Cart</span>
            </button>
          </div>
        </div>

        {/* Row 2: All + department strip (Amazon secondary nav) */}
        <div
          className="flex items-center gap-1 overflow-x-auto px-2 py-1.5 text-sm [scrollbar-width:none]"
          style={{ background: "#232f3e" }}
        >
          <button
            type="button"
            onClick={() => setDeptOpen((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 font-bold hover:outline hover:outline-1 hover:outline-white"
          >
            <Menu className="h-4 w-4" /> All
          </button>
          {(
            [
              ["deals", "Today's Deals"],
              ["orders", "Buy Again"],
              ["customer-service", "Customer Service"],
              ["lists", "Wish List"],
              ...(isSeller
                ? ([["seller", "Sell"], ["seller-inventory", "Inventory"], ["seller-orders", "Seller Orders"]] as const)
                : ([["seller", "Sell"]] as const)),
              ...(isOps ? ([["ops", "Ops desk"]] as const) : []),
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id as PageId)}
              className={cn(
                "shrink-0 rounded px-2 py-1 whitespace-nowrap hover:outline hover:outline-1 hover:outline-white",
                page === id && "outline outline-1 outline-white"
              )}
            >
              {label}
            </button>
          ))}
          {topCats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setActiveCategory(c);
                setSearchDept(c);
                setSearch("");
                go("search");
              }}
              className="shrink-0 rounded px-2 py-1 whitespace-nowrap text-white/90 hover:outline hover:outline-1 hover:outline-white"
            >
              {c}
            </button>
          ))}
        </div>

        {/* All departments flyout */}
        {deptOpen && (
          <div className="border-t border-white/10 bg-[#232f3e] px-3 py-3">
            <p className="mb-2 text-xs font-bold text-white/70">Shop by Department</p>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setActiveCategory(d);
                    setSearchDept(d);
                    setSearch("");
                    go("search");
                    setDeptOpen(false);
                  }}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
                >
                  {d}
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
            toast.kind === "success" && "bg-emerald-50 text-emerald-900",
            toast.kind === "error" && "bg-red-50 text-red-900",
            toast.kind === "info" && "bg-sky-50 text-sky-900"
          )}
        >
          {toast.kind === "success" && <CheckCircle2 className="h-4 w-4" />}
          {toast.kind === "error" && <XCircle className="h-4 w-4" />}
          {toast.kind === "info" && <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <main
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {busy && (
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-xs text-amber-900">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {busy}
          </div>
        )}

        {/* ── HOME ── */}
        {page === "home" && (
          <div className="space-y-4 pb-10">
            <div
              className="relative mx-2 mt-2 overflow-hidden rounded-lg px-5 py-8 text-white md:mx-4 md:py-12"
              style={{
                background: `linear-gradient(90deg, ${primary} 0%, #37475a 55%, ${accent}55 100%)`,
              }}
            >
              <p className="text-sm font-medium text-white/80">Welcome to {brand}</p>
              <h1 className="mt-1 max-w-xl text-2xl font-bold md:text-3xl">
                Great prices. Fast delivery. Everything you need.
              </h1>
              <p className="mt-2 max-w-lg text-sm text-white/85">
                Search millions of products · Track orders · Easy returns — same structure as
                Amazon-class marketplaces.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="bg-white text-black hover:bg-white/90"
                  onClick={() => {
                    setActiveCategory("All");
                    go("search");
                  }}
                >
                  Shop all
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10"
                  onClick={() => go("deals")}
                >
                  Today&apos;s Deals
                </Button>
              </div>
            </div>

            {/* Category tiles */}
            <div className="mx-2 grid gap-3 sm:grid-cols-2 md:mx-4 lg:grid-cols-4">
              {topCats.slice(0, 4).map((c) => {
                const sample = products.filter((p) => p.category === c).slice(0, 4);
                return (
                  <Card key={c} className="bg-white p-4 shadow-sm">
                    <h2 className="text-base font-bold">{c}</h2>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {sample.length
                        ? sample.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => openPdp(p.id)}
                              className="rounded border border-border p-2 text-left text-[11px] hover:border-[#c45500]"
                            >
                              <p className="line-clamp-2 font-medium">{p.title}</p>
                              <p className="mt-1 font-bold">{inr(p.price)}</p>
                            </button>
                          ))
                        : (
                            <p className="col-span-2 text-xs text-muted-foreground">
                              Browse {c}
                            </p>
                          )}
                    </div>
                    <button
                      type="button"
                      className="mt-3 text-xs text-[#007185] hover:underline"
                      onClick={() => {
                        setActiveCategory(c);
                        go("search");
                      }}
                    >
                      See more
                    </button>
                  </Card>
                );
              })}
            </div>

            {/* Deal rail */}
            <section className="mx-2 bg-white p-4 shadow-sm md:mx-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Today&apos;s Deals</h2>
                <button
                  type="button"
                  className="text-sm text-[#007185] hover:underline"
                  onClick={() => go("deals")}
                >
                  See all deals
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {products
                  .filter((p) => p.status === "Active" && p.mrp > p.price)
                  .map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onOpen={() => openPdp(p.id)}
                      onAdd={() => addToCart(p.id)}
                      onList={() => toggleList(p.id)}
                      listed={lists.includes(p.id)}
                      compact
                    />
                  ))}
              </div>
            </section>

            {/* Recommended */}
            <section className="mx-2 bg-white p-4 shadow-sm md:mx-4">
              <h2 className="mb-3 text-lg font-bold">Recommended for you</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {products
                  .filter((p) => p.status === "Active")
                  .slice(0, 8)
                  .map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onOpen={() => openPdp(p.id)}
                      onAdd={() => addToCart(p.id)}
                      onList={() => toggleList(p.id)}
                      listed={lists.includes(p.id)}
                    />
                  ))}
              </div>
            </section>

            {/* Sign-in / role strip */}
            <div className="mx-2 border border-[#ddd] bg-white p-6 text-center md:mx-4">
              <p className="font-bold">See personalized recommendations</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {spec.roles.map((r) => (
                  <Button
                    key={r.id}
                    type="button"
                    size="sm"
                    variant={r.id === roleId ? "cta" : "secondary"}
                    onClick={() => {
                      onRoleChange(r.id);
                      flash(`Viewing as ${r.label}`, "info");
                    }}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SEARCH / BROWSE ── */}
        {(page === "search" || page === "deals") && (
          <div className="mx-auto grid max-w-7xl gap-4 p-3 md:grid-cols-[220px_1fr] md:p-4">
            <aside className="rounded border border-[#ddd] bg-white p-3 text-sm">
              <p className="font-bold">Department</p>
              <ul className="mt-2 space-y-1">
                {["All", ...topCats].map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(c)}
                      className={cn(
                        "w-full rounded px-2 py-1 text-left hover:bg-[#f0f2f2]",
                        activeCategory === c && "bg-[#f0f2f2] font-semibold"
                      )}
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-bold">Customer reviews</p>
              <p className="mt-1 text-xs text-[#c45500]">{stars(4)} & Up</p>
              <p className="mt-3 font-bold">Delivery</p>
              <label className="mt-1 flex items-center gap-2 text-xs">
                <input type="checkbox" defaultChecked className="rounded" /> Get It by Tomorrow
              </label>
            </aside>
            <div>
              <p className="mb-2 text-sm text-[#565959]">
                {page === "deals" ? "Today's Deals" : "Results"}
                {activeCategory !== "All" ? ` · ${activeCategory}` : ""}
                {search ? ` · “${search}”` : ""} · {filtered.length} results
              </p>
              <div className="space-y-3">
                {(page === "deals"
                  ? filtered.filter((p) => p.mrp > p.price)
                  : filtered
                ).map((p) => (
                  <Card
                    key={p.id}
                    className="flex flex-wrap gap-4 bg-white p-4 shadow-sm"
                  >
                    <button
                      type="button"
                      className="flex h-28 w-28 shrink-0 items-center justify-center rounded bg-[#f7f8f8] text-3xl"
                      onClick={() => openPdp(p.id)}
                    >
                      📦
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="text-left text-base font-medium text-[#0f1111] hover:text-[#c45500] hover:underline"
                        onClick={() => openPdp(p.id)}
                      >
                        {p.title}
                      </button>
                      <p className="text-sm text-[#c45500]">
                        {stars(p.rating)}{" "}
                        <span className="text-[#007185]">{p.reviews.toLocaleString()}</span>
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {inr(p.price)}{" "}
                        <span className="text-sm font-normal text-[#565959] line-through">
                          {inr(p.mrp)}
                        </span>
                      </p>
                      {p.prime && (
                        <p className="text-xs font-semibold text-[#00a8e1]">prime</p>
                      )}
                      <p className="mt-1 text-xs text-[#565959]">{p.description}</p>
                      <p className="text-xs text-[#565959]">Sold by {p.seller}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="cta"
                          disabled={p.status !== "Active"}
                          onClick={() => addToCart(p.id)}
                        >
                          Add to Cart
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => toggleList(p.id)}
                        >
                          <Heart className="h-3.5 w-3.5" /> List
                        </Button>
                        {p.status !== "Active" && (
                          <Badge className="bg-muted">{p.status}</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {filtered.length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="font-medium">No results</p>
                    <Button type="button" className="mt-3" onClick={() => go("home")}>
                      Back to home
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PDP ── */}
        {page === "pdp" && pdp && (
          <div className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[1fr_1.2fr_280px]">
            <div className="flex h-64 items-center justify-center rounded border border-[#ddd] bg-white text-6xl md:h-96">
              📦
            </div>
            <div>
              <h1 className="text-xl font-medium md:text-2xl">{pdp.title}</h1>
              <p className="mt-1 text-sm text-[#007185]">Visit the {pdp.seller} Store</p>
              <p className="text-[#c45500]">
                {stars(pdp.rating)} {pdp.rating} · {pdp.reviews.toLocaleString()} ratings
              </p>
              <hr className="my-3 border-[#ddd]" />
              <p className="text-2xl font-normal">
                <span className="text-sm align-top">₹</span>
                {pdp.price.toLocaleString("en-IN")}
              </p>
              <p className="text-sm text-[#565959]">
                M.R.P.: <span className="line-through">{inr(pdp.mrp)}</span> ·{" "}
                {Math.round((1 - pdp.price / pdp.mrp) * 100)}% off
              </p>
              {pdp.prime && (
                <p className="mt-2 text-sm">
                  <span className="font-bold text-[#00a8e1]">prime</span> FREE delivery Tomorrow
                </p>
              )}
              <p className="mt-3 text-sm">{pdp.description}</p>
              <ul className="mt-3 list-inside list-disc text-sm text-[#0f1111]">
                <li>Category: {pdp.category}</li>
                <li>Sold by {pdp.seller}</li>
                <li>Status: {pdp.status}</li>
              </ul>
            </div>
            <Card className="h-fit border-[#d5d9d9] p-4 shadow-sm">
              <p className="text-xl">
                <span className="text-sm align-top">₹</span>
                {pdp.price.toLocaleString("en-IN")}
              </p>
              <p className="mt-2 text-sm text-[#007185]">
                <Truck className="mr-1 inline h-4 w-4" />
                FREE delivery <strong>Tomorrow</strong>
              </p>
              <p className="mt-1 text-sm">
                Delivering to <strong>{address.split(",")[0]}</strong> —{" "}
                <button
                  type="button"
                  className="text-[#007185] hover:underline"
                  onClick={() => go("addresses")}
                >
                  Update location
                </button>
              </p>
              <p
                className={cn(
                  "mt-3 text-lg font-medium",
                  pdp.status === "Active" ? "text-[#007600]" : "text-red-700"
                )}
              >
                {pdp.status === "Active" ? "In stock" : pdp.status}
              </p>
              <Button
                type="button"
                className="mt-3 w-full"
                variant="cta"
                disabled={pdp.status !== "Active"}
                onClick={() => addToCart(pdp.id)}
              >
                Add to Cart
              </Button>
              <Button
                type="button"
                className="mt-2 w-full"
                variant="secondary"
                disabled={pdp.status !== "Active"}
                onClick={() => {
                  addToCart(pdp.id);
                  go("checkout");
                }}
              >
                Buy Now
              </Button>
              <Button
                type="button"
                className="mt-2 w-full"
                variant="secondary"
                onClick={() => toggleList(pdp.id)}
              >
                <Heart className="h-4 w-4" /> Add to Wish List
              </Button>
              <p className="mt-3 text-xs text-[#565959]">
                Secure transaction · 7-day return (demo)
              </p>
            </Card>
          </div>
        )}

        {/* ── CART ── */}
        {page === "cart" && (
          <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-[1fr_280px]">
            <div className="bg-white p-4 shadow-sm">
              <h1 className="text-2xl font-normal">Shopping Cart</h1>
              {!cartLines.length && (
                <div className="py-10 text-center">
                  <p className="text-lg">Your {brand} Cart is empty</p>
                  <Button type="button" className="mt-3" variant="cta" onClick={() => go("home")}>
                    Continue shopping
                  </Button>
                </div>
              )}
              {cartLines.map((l) => (
                <div
                  key={l.productId}
                  className="flex flex-wrap gap-4 border-t border-[#ddd] py-4"
                >
                  <div className="flex h-24 w-24 items-center justify-center bg-[#f7f8f8] text-3xl">
                    📦
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="text-left font-medium hover:text-[#c45500] hover:underline"
                      onClick={() => openPdp(l.productId)}
                    >
                      {l.product.title}
                    </button>
                    <p className="text-sm text-[#007600]">In stock</p>
                    <p className="text-sm font-bold">{inr(l.product.price)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="text-sm">
                        Qty{" "}
                        <select
                          value={l.qty}
                          onChange={(e) => setQty(l.productId, Number(e.target.value))}
                          className="rounded border border-[#d5d9d9] px-2 py-1"
                        >
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n === 0 ? "0 (Delete)" : n}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="text-sm text-[#007185] hover:underline"
                        onClick={() => setQty(l.productId, 0)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="text-sm text-[#007185] hover:underline"
                        onClick={() => toggleList(l.productId)}
                      >
                        Save for later
                      </button>
                    </div>
                  </div>
                  <p className="font-bold">{inr(l.product.price * l.qty)}</p>
                </div>
              ))}
            </div>
            <Card className="h-fit border-[#d5d9d9] p-4">
              <p className="text-lg">
                Subtotal ({cartCount} items): <strong>{inr(cartTotal)}</strong>
              </p>
              <Button
                type="button"
                className="mt-3 w-full"
                variant="cta"
                disabled={!cartLines.length}
                onClick={() => go("checkout")}
              >
                Proceed to Buy
              </Button>
            </Card>
          </div>
        )}

        {/* ── CHECKOUT ── */}
        {page === "checkout" && (
          <div className="mx-auto max-w-3xl space-y-4 p-4">
            <h1 className="text-2xl font-normal">Checkout</h1>
            <Card className="space-y-3 border-[#d5d9d9] p-4">
              <h2 className="font-bold">1 · Delivery address</h2>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  placeholder="Full name"
                />
                <Input
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  placeholder="Phone"
                />
              </div>
            </Card>
            <Card className="space-y-2 border-[#d5d9d9] p-4">
              <h2 className="font-bold">2 · Payment method</h2>
              {(
                [
                  ["upi", "UPI"],
                  ["card", "Credit / Debit card"],
                  ["cod", "Cash on Delivery"],
                ] as const
              ).map(([id, label]) => (
                <label key={id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="pay"
                    checked={payMethod === id}
                    onChange={() => setPayMethod(id)}
                  />
                  {label}
                </label>
              ))}
            </Card>
            <Card className="border-[#d5d9d9] p-4">
              <h2 className="font-bold">3 · Review items</h2>
              {cartLines.map((l) => (
                <p key={l.productId} className="mt-1 text-sm">
                  {l.qty}× {l.product.title} — {inr(l.product.price * l.qty)}
                </p>
              ))}
              <p className="mt-3 text-lg font-bold">Order total: {inr(cartTotal)}</p>
              <Button
                type="button"
                className="mt-3"
                variant="cta"
                disabled={Boolean(busy) || !cartLines.length}
                onClick={() => void placeOrder()}
              >
                {busy === "checkout" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Place your order
              </Button>
              <p className="mt-2 text-xs text-[#565959]">
                Demo payment only. Use Account → sandbox path to force fail/success.
              </p>
            </Card>
          </div>
        )}

        {/* ── ORDERS ── */}
        {page === "orders" && (
          <div className="mx-auto max-w-4xl space-y-3 p-4">
            <h1 className="text-2xl font-normal">Your Orders</h1>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge className="bg-[#232f3e] text-white">Orders</Badge>
              <button type="button" className="text-[#007185] hover:underline" onClick={() => go("returns")}>
                Buy Again
              </button>
              <button type="button" className="text-[#007185] hover:underline" onClick={() => go("returns")}>
                Not Yet Shipped
              </button>
              <button type="button" className="text-[#007185] hover:underline" onClick={() => go("returns")}>
                Cancelled Orders
              </button>
            </div>
            {orders.map((o) => (
              <Card key={o.id} className="border-[#d5d9d9] bg-white p-4">
                <div className="flex flex-wrap justify-between gap-2 border-b border-[#ddd] pb-2 text-xs text-[#565959]">
                  <span>
                    ORDER PLACED
                    <br />
                    <strong className="text-[#0f1111]">{o.id}</strong>
                  </span>
                  <span>
                    TOTAL
                    <br />
                    <strong className="text-[#0f1111]">{inr(o.amount)}</strong>
                  </span>
                  <span>
                    SHIP TO
                    <br />
                    <strong className="text-[#0f1111]">{o.address.split(",")[0]}</strong>
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#007600]">{o.status}</p>
                    <p className="text-sm">{o.title}</p>
                    <p className="text-xs text-[#565959]">
                      {o.items} · {o.eta}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void advanceOrder(o.id)}
                    >
                      Track package
                    </Button>
                    {(o.status === "Delivered" || o.status === "Shipped") && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void requestReturn(o.id)}
                      >
                        Return or replace
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => go("customer-service")}
                    >
                      Problem with order
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {page === "returns" && (
          <div className="mx-auto max-w-3xl space-y-3 p-4">
            <h1 className="text-2xl font-normal">Returns & refunds</h1>
            {orders
              .filter((o) => o.status === "Returned" || o.status === "Delivered")
              .map((o) => (
                <Card key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{o.title}</p>
                    <p className="text-xs text-[#565959]">
                      {o.id} · {o.status} · {o.eta}
                    </p>
                  </div>
                  {o.status === "Delivered" ? (
                    <Button type="button" size="sm" variant="cta" onClick={() => void requestReturn(o.id)}>
                      Start return
                    </Button>
                  ) : (
                    <Badge className="bg-muted">Return in progress</Badge>
                  )}
                </Card>
              ))}
            <Button type="button" variant="secondary" onClick={() => go("orders")}>
              Back to orders
            </Button>
          </div>
        )}

        {/* ── ACCOUNT ── */}
        {page === "account" && (
          <div className="mx-auto max-w-4xl p-4">
            <h1 className="text-2xl font-normal">Your Account</h1>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["orders", "Your Orders", "Track, return, or buy again", Package],
                  ["lists", "Wish List", "View saved items", Heart],
                  ["addresses", "Addresses", "Edit delivery locations", MapPin],
                  ["customer-service", "Customer Service", "Help with orders", AlertTriangle],
                  ["cart", "Cart", "Review items before checkout", ShoppingCart],
                  ["home", "Home", "Continue shopping", Home],
                ] as const
              ).map(([id, title, sub, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => go(id)}
                  className="flex gap-3 rounded border border-[#d5d9d9] bg-white p-4 text-left hover:bg-[#f7fafa]"
                >
                  <Icon className="h-8 w-8 text-[#565959]" />
                  <span>
                    <span className="block font-bold">{title}</span>
                    <span className="text-xs text-[#565959]">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <Card className="mt-4 space-y-2 p-4">
              <p className="font-bold">Demo sandbox</p>
              <label className="block text-sm">
                API path
                <select
                  className="mt-1 w-full rounded border border-[#d5d9d9] px-2 py-2"
                  value={pathMode}
                  onChange={(e) => setPathMode(e.target.value as MockPathMode)}
                >
                  <option value="auto">Auto (realistic)</option>
                  <option value="always_ok">Always succeed</option>
                  <option value="always_fail">Always fail</option>
                </select>
              </label>
              <p className="text-xs text-[#565959]">
                Signed in as <strong>{role?.label}</strong> — switch roles in the header.
              </p>
            </Card>
          </div>
        )}

        {page === "lists" && (
          <div className="mx-auto max-w-4xl space-y-3 p-4">
            <h1 className="text-2xl font-normal">Your Wish List</h1>
            {!lists.length && (
              <Card className="p-8 text-center">
                <p>Your list is empty</p>
                <Button type="button" className="mt-3" variant="cta" onClick={() => go("home")}>
                  Find something to save
                </Button>
              </Card>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lists.map((id) => {
                const p = products.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <ProductCard
                    key={id}
                    product={p}
                    onOpen={() => openPdp(id)}
                    onAdd={() => addToCart(id)}
                    onList={() => toggleList(id)}
                    listed
                  />
                );
              })}
            </div>
          </div>
        )}

        {page === "addresses" && (
          <div className="mx-auto max-w-xl space-y-3 p-4">
            <h1 className="text-2xl font-normal">Your Addresses</h1>
            <Card className="space-y-2 border-[#d5d9d9] p-4">
              <p className="font-bold">Default delivery address</p>
              <textarea
                className="w-full rounded border border-[#d5d9d9] p-2 text-sm"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Button
                type="button"
                variant="cta"
                onClick={() => {
                  flash("Address saved", "success");
                  go("home");
                }}
              >
                Save address
              </Button>
            </Card>
          </div>
        )}

        {page === "customer-service" && (
          <div className="mx-auto max-w-2xl space-y-3 p-4">
            <h1 className="text-2xl font-normal">Customer Service</h1>
            <Card className="divide-y border-[#d5d9d9]">
              {[
                ["Track your package", "orders"],
                ["Returns & refunds", "returns"],
                ["Manage address", "addresses"],
                ["Payment issues (demo)", "account"],
              ].map(([label, id]) => (
                <button
                  key={label}
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-[#f7fafa]"
                  onClick={() => go(id as PageId)}
                >
                  {label}
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              ))}
            </Card>
            <Button type="button" variant="secondary" onClick={() => flash("Support ticket created (demo)", "success")}>
              Contact us
            </Button>
          </div>
        )}

        {page === "departments" && (
          <div className="p-4">
            <h1 className="text-xl font-bold">All Departments</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="rounded-full border bg-white px-3 py-1.5 text-sm"
                  onClick={() => {
                    setActiveCategory(d);
                    go("search");
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── SELLER CENTRAL ── */}
        {(page === "seller" || page === "seller-inventory" || page === "seller-orders") && (
          <div className="mx-auto max-w-4xl space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-normal">Seller Central</h1>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={page === "seller" ? "cta" : "secondary"}
                  onClick={() => go("seller")}
                >
                  Add product
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={page === "seller-inventory" ? "cta" : "secondary"}
                  onClick={() => go("seller-inventory")}
                >
                  Inventory
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={page === "seller-orders" ? "cta" : "secondary"}
                  onClick={() => go("seller-orders")}
                >
                  Orders
                </Button>
              </div>
            </div>
            {!isSeller && !isOps && (
              <Card className="border-amber-300 bg-amber-50 p-4 text-sm">
                Switch role to <strong>Seller</strong> (header) for full listing permissions.
                You can still preview Seller Central.
              </Card>
            )}
            {page === "seller" && (
              <Card className="space-y-3 border-[#d5d9d9] p-4">
                <h2 className="font-bold">Create a listing</h2>
                <Input
                  placeholder="Product title"
                  value={listProductTitle}
                  onChange={(e) => setListProductTitle(e.target.value)}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    type="number"
                    placeholder="Price (₹)"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                  />
                  <select
                    className="rounded border border-[#d5d9d9] px-2 py-2 text-sm"
                    value={listCategory}
                    onChange={(e) => setListCategory(e.target.value)}
                  >
                    {topCats.map((c) => (
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
                      <p className="text-xs text-[#565959]">
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
                                    status:
                                      x.status === "Active" ? "Out of stock" : "Active",
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
                      <p className="text-xs text-[#565959]">
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
          <div className="mx-auto max-w-4xl space-y-3 p-4">
            <h1 className="text-2xl font-normal">Marketplace ops</h1>
            <p className="text-sm text-[#565959]">
              Disputes, suspended listings, and returns queue (Amazon Seller Support / A-to-z style).
            </p>
            {products
              .filter((p) => p.status === "Suspended" || p.status === "Out of stock")
              .map((p) => (
                <Card key={p.id} className="flex justify-between gap-2 p-3">
                  <span>
                    {p.title} · <Badge className="bg-muted">{p.status}</Badge>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setProducts((prev) =>
                        prev.map((x) =>
                          x.id === p.id ? { ...x, status: "Active" } : x
                        )
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
          </div>
        )}

        {/* Amazon-style footer */}
        <footer className="mt-8 text-white" style={{ background: "#232f3e" }}>
          <button
            type="button"
            className="w-full bg-[#37475a] py-3 text-sm font-medium hover:bg-[#485769]"
            onClick={() => {
              if (typeof window !== "undefined")
                document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Back to top
          </button>
          <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-2 font-bold">Get to Know Us</p>
              <FooterBtn onClick={() => go("customer-service")}>About {brand}</FooterBtn>
              <FooterBtn onClick={() => go("customer-service")}>Careers</FooterBtn>
            </div>
            <div>
              <p className="mb-2 font-bold">Make Money with Us</p>
              <FooterBtn onClick={() => go("seller")}>Sell products</FooterBtn>
              <FooterBtn onClick={() => go("seller-inventory")}>Seller Central</FooterBtn>
            </div>
            <div>
              <p className="mb-2 font-bold">Let Us Help You</p>
              <FooterBtn onClick={() => go("account")}>Your Account</FooterBtn>
              <FooterBtn onClick={() => go("orders")}>Your Orders</FooterBtn>
              <FooterBtn onClick={() => go("returns")}>Returns Centre</FooterBtn>
              <FooterBtn onClick={() => go("customer-service")}>Help</FooterBtn>
            </div>
            <div>
              <p className="mb-2 font-bold">Shop</p>
              <FooterBtn onClick={() => go("home")}>Home</FooterBtn>
              <FooterBtn onClick={() => go("deals")}>Today&apos;s Deals</FooterBtn>
              <FooterBtn onClick={() => go("cart")}>Cart ({cartCount})</FooterBtn>
            </div>
          </div>
          <div className="border-t border-white/10 py-4 text-center text-xs text-white/70">
            © {new Date().getFullYear()} {brand}. Demo marketplace — not affiliated with Amazon.
            No real payments.
          </div>
        </footer>
      </main>

      {/* Mobile bottom bar — Amazon app-like */}
      <nav
        className="flex shrink-0 border-t border-[#ddd] bg-white md:hidden"
        style={{ color: primary }}
      >
        {(
          [
            ["home", "Home", Home],
            ["account", "You", UserRound],
            ["orders", "Orders", Package],
            ["cart", "Cart", ShoppingCart],
            ["departments", "Menu", Menu],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
              page === id ? "text-[#c45500]" : "text-[#565959]"
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {id === "cart" && cartCount > 0 && (
                <span className="absolute -top-1 -right-2 rounded-full bg-[#f08804] px-1 text-[9px] font-bold text-black">
                  {cartCount}
                </span>
              )}
            </span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function FooterBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block py-0.5 text-left text-white/80 hover:underline"
    >
      {children}
    </button>
  );
}

function ProductCard({
  product,
  onOpen,
  onAdd,
  onList,
  listed,
  compact,
}: {
  product: Product;
  onOpen: () => void;
  onAdd: () => void;
  onList: () => void;
  listed?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded border border-[#ddd] bg-white p-3 shadow-sm",
        compact && "w-44 shrink-0"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex h-28 w-full items-center justify-center rounded bg-[#f7f8f8] text-3xl"
      >
        📦
      </button>
      {product.badge && (
        <p className="mt-1 text-[10px] font-bold text-[#c45500]">{product.badge}</p>
      )}
      <button
        type="button"
        onClick={onOpen}
        className="mt-1 line-clamp-2 text-left text-sm hover:text-[#c45500]"
      >
        {product.title}
      </button>
      <p className="text-xs text-[#c45500]">{stars(product.rating)}</p>
      <p className="font-bold">
        {inr(product.price)}{" "}
        <span className="text-xs font-normal text-[#565959] line-through">
          {inr(product.mrp)}
        </span>
      </p>
      {product.prime && <p className="text-[10px] font-bold text-[#00a8e1]">prime</p>}
      <div className="mt-2 flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant="cta"
          className="h-8 text-xs"
          disabled={product.status !== "Active"}
          onClick={onAdd}
        >
          Add to Cart
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 text-xs"
          onClick={onList}
        >
          <Heart className={cn("h-3 w-3", listed && "fill-red-500 text-red-500")} />
        </Button>
      </div>
    </div>
  );
}
