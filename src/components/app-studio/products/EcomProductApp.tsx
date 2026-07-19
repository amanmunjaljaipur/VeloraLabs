"use client";

/**
 * Dual-portal marketplace product:
 * 1) Shopper storefront - browse, bag, checkout, track, returns
 * 2) Seller Hub - separate B2B portal (dashboard, listings, inventory,
 *    fulfilment orders, returns, settlements/P&L) - not the customer UI
 * 3) Ops desk - trust & safety
 *
 * Modelled on real seller hubs (Seller Central / Flipkart Seller Hub style jobs)
 * with original Verlin Labs visual design.
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
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Heart,
  Home,
  IndianRupee,
  LayoutGrid,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  UserRound,
  Warehouse,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";

type Product = {
  id: string;
  title: string;
  price: number;
  mrp: number;
  /** Seller cost of goods (for P&L) */
  cost: number;
  category: string;
  rating: number;
  reviews: number;
  express: boolean;
  status: "Active" | "Out of stock" | "Suspended";
  description: string;
  seller: string;
  badge?: string;
  hue: string;
  stock: number;
  unitsSold: number;
  /** Only seller-owned SKUs show in Seller Hub catalog */
  ownedBySeller: boolean;
};

type CartLine = { productId: string; qty: number };

type OrderLine = { productId: string; title: string; qty: number; unitPrice: number };

type Order = {
  id: string;
  title: string;
  amount: number;
  status: "Placed" | "Packed" | "Shipped" | "Out for delivery" | "Delivered" | "Returned" | "Cancelled";
  items: string;
  eta: string;
  address: string;
  lines: OrderLine[];
  /** Marketplace fee % of GMV */
  feePct: number;
  /** Belongs to seller fulfilment queue */
  sellerOrder: boolean;
  placedAt: string;
};

type ShopPage =
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
  | "deals";

type SellerPage =
  | "s-home"
  | "s-listings"
  | "s-add"
  | "s-inventory"
  | "s-orders"
  | "s-returns"
  | "s-payments"
  | "s-performance"
  | "s-settings";

type OpsPage = "ops";

type Portal = "shop" | "seller" | "ops";

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
    cost: 1100,
    category: "Electronics",
    rating: 4.5,
    reviews: 2840,
    express: true,
    status: "Active",
    description: "Active noise cancel · 36h case battery · dual-device connect.",
    seller: "Your shop",
    badge: "Editor pick",
    hue: "from-sky-500/20 to-indigo-600/30",
    stock: 42,
    unitsSold: 318,
    ownedBySeller: true,
  },
  {
    id: "p2",
    title: "StudioFlow Yoga Mat 6mm",
    price: 899,
    mrp: 1499,
    cost: 320,
    category: "Sports",
    rating: 4.3,
    reviews: 1201,
    express: true,
    status: "Active",
    description: "Non-slip TPE · light carry strap.",
    seller: "Your shop",
    hue: "from-emerald-400/25 to-teal-700/25",
    stock: 8,
    unitsSold: 156,
    ownedBySeller: true,
  },
  {
    id: "p3",
    title: "DockOne USB-C Hub 7-port",
    price: 1299,
    mrp: 2499,
    cost: 580,
    category: "Work",
    rating: 4.1,
    reviews: 640,
    express: false,
    status: "Out of stock",
    description: "4K HDMI · USB 3 · 100W pass-through.",
    seller: "Your shop",
    hue: "from-slate-400/20 to-slate-700/30",
    stock: 0,
    unitsSold: 89,
    ownedBySeller: true,
  },
  {
    id: "p4",
    title: "Northline Insulated Bottle 1L",
    price: 599,
    mrp: 999,
    cost: 180,
    category: "Home",
    rating: 4.6,
    reviews: 3102,
    express: true,
    status: "Active",
    description: "Cold 24h · hot 12h · leak-safe lid.",
    seller: "Your shop",
    badge: "Top rated",
    hue: "from-cyan-400/20 to-blue-700/25",
    stock: 120,
    unitsSold: 540,
    ownedBySeller: true,
  },
  {
    id: "p5",
    title: "Everyday Cotton Tee · 3 pack",
    price: 799,
    mrp: 1599,
    cost: 290,
    category: "Fashion",
    rating: 4.2,
    reviews: 980,
    express: true,
    status: "Active",
    description: "Soft mid-weight cotton · regular fit.",
    seller: "Thread & Co.",
    hue: "from-amber-300/25 to-orange-600/20",
    stock: 200,
    unitsSold: 90,
    ownedBySeller: false,
  },
  {
    id: "p6",
    title: "Clear Thinking Journal",
    price: 449,
    mrp: 699,
    cost: 120,
    category: "Books",
    rating: 4.7,
    reviews: 5200,
    express: true,
    status: "Active",
    description: "Prompted pages for decisions and weekly review.",
    seller: "Horizon Press",
    badge: "Bestseller",
    hue: "from-violet-400/20 to-purple-700/25",
    stock: 75,
    unitsSold: 210,
    ownedBySeller: false,
  },
  {
    id: "p7",
    title: "Lumen Colour Smart Bulb",
    price: 449,
    mrp: 899,
    cost: 150,
    category: "Home",
    rating: 4.4,
    reviews: 760,
    express: true,
    status: "Active",
    description: "App schedules · warm-to-cool white.",
    seller: "Your shop",
    hue: "from-yellow-300/25 to-amber-600/20",
    stock: 5,
    unitsSold: 64,
    ownedBySeller: true,
  },
  {
    id: "p8",
    title: "Hillside Raw Honey 500g",
    price: 349,
    mrp: 450,
    cost: 140,
    category: "Grocery",
    rating: 4.5,
    reviews: 420,
    express: false,
    status: "Suspended",
    description: "Single-origin · glass jar. Under policy review.",
    seller: "Your shop",
    hue: "from-amber-200/30 to-yellow-700/20",
    stock: 30,
    unitsSold: 12,
    ownedBySeller: true,
  },
];

const SEED_ORDERS: Order[] = [
  {
    id: "HM-10482",
    title: "Auralis ANC Earbuds",
    amount: 2499,
    status: "Shipped",
    items: "1 item",
    eta: "In transit",
    address: "Koramangala, Bengaluru 560034",
    lines: [{ productId: "p1", title: "Auralis ANC Earbuds", qty: 1, unitPrice: 2499 }],
    feePct: 12,
    sellerOrder: true,
    placedAt: "2026-03-18",
  },
  {
    id: "HM-10391",
    title: "Yoga mat + bottle",
    amount: 1498,
    status: "Delivered",
    items: "2 items",
    eta: "Delivered 12 Mar",
    address: "Indiranagar, Bengaluru 560038",
    lines: [
      { productId: "p2", title: "StudioFlow Yoga Mat 6mm", qty: 1, unitPrice: 899 },
      { productId: "p4", title: "Northline Insulated Bottle 1L", qty: 1, unitPrice: 599 },
    ],
    feePct: 12,
    sellerOrder: true,
    placedAt: "2026-03-12",
  },
  {
    id: "HM-10501",
    title: "Cotton tee pack",
    amount: 799,
    status: "Placed",
    items: "1 item",
    eta: "Awaiting pack",
    address: "HSR Layout, Bengaluru 560102",
    lines: [{ productId: "p5", title: "Everyday Cotton Tee · 3 pack", qty: 1, unitPrice: 799 }],
    feePct: 15,
    sellerOrder: false,
    placedAt: "2026-03-20",
  },
  {
    id: "HM-10510",
    title: "Lumen Smart Bulb ×2",
    amount: 898,
    status: "Placed",
    items: "2 items",
    eta: "Awaiting pack",
    address: "Whitefield, Bengaluru 560066",
    lines: [{ productId: "p7", title: "Lumen Colour Smart Bulb", qty: 2, unitPrice: 449 }],
    feePct: 12,
    sellerOrder: true,
    placedAt: "2026-03-21",
  },
  {
    id: "HM-10220",
    title: "DockOne Hub",
    amount: 1299,
    status: "Returned",
    items: "1 item",
    eta: "Refund pending settlement",
    address: "Jayanagar, Bengaluru 560041",
    lines: [{ productId: "p3", title: "DockOne USB-C Hub 7-port", qty: 1, unitPrice: 1299 }],
    feePct: 12,
    sellerOrder: true,
    placedAt: "2026-03-05",
  },
  {
    id: "HM-10401",
    title: "Yoga mat",
    amount: 899,
    status: "Packed",
    items: "1 item",
    eta: "Ready for pickup",
    address: "BTM Layout, Bengaluru 560076",
    lines: [{ productId: "p2", title: "StudioFlow Yoga Mat 6mm", qty: 1, unitPrice: 899 }],
    feePct: 12,
    sellerOrder: true,
    placedAt: "2026-03-19",
  },
];

function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function resolvePortal(roleId: string, roleLabel: string): Portal {
  const blob = `${roleId} ${roleLabel}`.toLowerCase();
  if (/seller|merchant|vendor/.test(blob)) return "seller";
  if (/ops|admin|moderator|compliance/.test(blob)) return "ops";
  return "shop";
}

export function EcomProductApp({
  spec,
  role,
  roleId,
  onRoleChange,
  fullScreen,
  canSwitchRoles = true,
}: {
  spec: StudioAppSpec;
  role?: StudioRole;
  roleId: string;
  onRoleChange: (id: string) => void;
  fullScreen?: boolean;
  canSwitchRoles?: boolean;
  sessionName?: string;
}) {
  const brand = spec.brandName || "Horizon Market";
  const primary = spec.primaryColor || "#0f2744";
  const accent = spec.accentColor || "#0d9488";

  const portal = resolvePortal(roleId, role?.label || "");

  const [shopPage, setShopPage] = useState<ShopPage>("home");
  const [sellerPage, setSellerPage] = useState<SellerPage>("s-home");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
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
  const [listCost, setListCost] = useState("");
  const [listStock, setListStock] = useState("20");
  const [listCat, setListCat] = useState("Electronics");
  const [listDesc, setListDesc] = useState("");
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [returnReason, setReturnReason] = useState<Record<string, string>>({});

  // Enter correct home when role/portal changes
  useEffect(() => {
    if (portal === "seller") setSellerPage("s-home");
    if (portal === "shop") setShopPage("home");
  }, [portal, roleId]);

  const sellerSkus = useMemo(
    () => products.filter((p) => p.ownedBySeller),
    [products]
  );
  const sellerOrders = useMemo(
    () => orders.filter((o) => o.sellerOrder),
    [orders]
  );

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
          p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, category, search]);

  const pdp = products.find((p) => p.id === pdpId) || null;

  /** Seller P&L from fulfilled + returned seller orders */
  const finance = useMemo(() => {
    let gross = 0;
    let fees = 0;
    let cogs = 0;
    let returnLoss = 0;
    let deliveredCount = 0;
    let returnCount = 0;
    let pendingCount = 0;

    for (const o of sellerOrders) {
      const orderGross = o.amount;
      const orderFee = (orderGross * o.feePct) / 100;
      if (o.status === "Delivered" || o.status === "Shipped" || o.status === "Out for delivery") {
        gross += orderGross;
        fees += orderFee;
        for (const line of o.lines) {
          const prod = products.find((p) => p.id === line.productId);
          cogs += (prod?.cost || line.unitPrice * 0.4) * line.qty;
        }
        if (o.status === "Delivered") deliveredCount++;
      }
      if (o.status === "Returned") {
        returnCount++;
        returnLoss += orderGross * 0.15; // restocking / reverse logistics hit
        fees += orderFee * 0.5; // partial fee retention demo
      }
      if (o.status === "Placed" || o.status === "Packed") pendingCount++;
    }

    const net = gross - fees - cogs - returnLoss;
    const lowStock = sellerSkus.filter((p) => p.stock > 0 && p.stock <= 10);
    const oos = sellerSkus.filter((p) => p.stock === 0 || p.status === "Out of stock");

    return {
      gross,
      fees,
      cogs,
      returnLoss,
      net,
      deliveredCount,
      returnCount,
      pendingCount,
      lowStock,
      oos,
      gmvThisMonth: gross,
      returnRate:
        deliveredCount + returnCount > 0
          ? Math.round((returnCount / (deliveredCount + returnCount)) * 100)
          : 0,
    };
  }, [sellerOrders, products, sellerSkus]);

  function flash(msg: string, kind: ToastKind = "success") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3400);
  }

  function goShop(p: ShopPage) {
    setShopPage(p);
    if (p !== "pdp") setPdpId(null);
  }

  function openPdp(id: string) {
    setPdpId(id);
    setShopPage("pdp");
  }

  function addToCart(productId: string, qty = 1) {
    const p = products.find((x) => x.id === productId);
    if (!p || p.status !== "Active" || p.stock <= 0) {
      flash("Item unavailable", "error");
      return;
    }
    setCart((prev) => {
      const hit = prev.find((l) => l.productId === productId);
      if (hit) {
        return prev.map((l) =>
          l.productId === productId
            ? { ...l, qty: Math.min(p.stock, l.qty + qty) }
            : l
        );
      }
      return [...prev, { productId, qty: Math.min(p.stock, qty) }];
    });
    flash(`Added to bag · ${p.title}`, "success");
  }

  function setQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.productId !== productId));
      flash("Removed from bag", "info");
      return;
    }
    const p = products.find((x) => x.id === productId);
    setCart((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? { ...l, qty: Math.min(p?.stock || 10, qty) }
          : l
      )
    );
  }

  function toggleSaved(productId: string) {
    const on = saved.includes(productId);
    setSaved((prev) => (on ? prev.filter((id) => id !== productId) : [...prev, productId]));
    flash(on ? "Removed from saved" : "Saved for later", "success");
  }

  async function placeOrder() {
    if (!cartLines.length) {
      flash("Bag is empty", "error");
      return;
    }
    if (!name.trim() || phone.replace(/\D/g, "").length < 10 || address.trim().length < 8) {
      flash("Complete name, phone, and full address", "error");
      return;
    }
    setBusy("checkout");
    const res = await mockApiCall({
      endpoint: "POST /shop/orders",
      mode: pathMode,
      payload: { cart, address, pay, name },
      failMessage: "Payment failed - try another method or change sandbox in Account",
      successMessage: "Order placed",
      onSuccess: () => {
        const id = `HM-${10000 + Math.floor(Math.random() * 90000)}`;
        const lines: OrderLine[] = cartLines.map((l) => ({
          productId: l.productId,
          title: l.product.title,
          qty: l.qty,
          unitPrice: l.product.price,
        }));
        // Reduce stock for owned seller items
        setProducts((prev) =>
          prev.map((p) => {
            const line = cartLines.find((l) => l.productId === p.id);
            if (!line) return p;
            const stock = Math.max(0, p.stock - line.qty);
            return {
              ...p,
              stock,
              unitsSold: p.unitsSold + line.qty,
              status: stock === 0 ? "Out of stock" : p.status,
            };
          })
        );
        const order: Order = {
          id,
          title: lines.map((l) => l.title).slice(0, 2).join(" + "),
          amount: cartTotal,
          status: "Placed",
          items: `${cartCount} item${cartCount === 1 ? "" : "s"}`,
          eta: "Seller packing",
          address,
          lines,
          feePct: 12,
          sellerOrder: lines.some((l) =>
            products.find((p) => p.id === l.productId)?.ownedBySeller
          ),
          placedAt: new Date().toISOString().slice(0, 10),
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
    goShop("orders");
  }

  async function shopperAdvance(id: string) {
    // Shoppers only “track” - seller advances fulfilment. Tracking just shows message.
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    flash(`Tracking: ${o.status} · ${o.eta}`, "info");
  }

  async function sellerAdvanceOrder(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order || !order.sellerOrder) {
      flash("Not a seller-fulfilment order", "error");
      return;
    }
    const flow: Order["status"][] = [
      "Placed",
      "Packed",
      "Shipped",
      "Out for delivery",
      "Delivered",
    ];
    const idx = flow.indexOf(order.status as (typeof flow)[number]);
    if (idx < 0 || idx >= flow.length - 1) {
      flash("Cannot advance this order further", "info");
      return;
    }
    const next = flow[idx + 1];
    setBusy(`s-ord-${id}`);
    const res = await mockApiCall({
      endpoint: `PATCH /seller/orders/${id}`,
      mode: pathMode,
      payload: { status: next },
      failMessage: "Fulfilment update failed",
      successMessage: `Order marked ${next}`,
      onSuccess: () => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: next,
                  eta:
                    next === "Packed"
                      ? "Ready for courier"
                      : next === "Shipped"
                        ? "In transit"
                        : next === "Out for delivery"
                          ? "Out today"
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

  async function acceptReturn(id: string, approve: boolean) {
    setBusy(`ret-${id}`);
    const res = await mockApiCall({
      endpoint: `POST /seller/returns/${id}`,
      mode: pathMode,
      payload: { approve, reason: returnReason[id] },
      failMessage: "Return action failed",
      successMessage: approve ? "Return approved · refund queued" : "Return rejected",
      onSuccess: () => {
        if (approve) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === id
                ? { ...o, status: "Returned", eta: "Refund in next settlement" }
                : o
            )
          );
        }
        return true;
      },
    });
    setBusy(null);
    flash(res.ok ? `${res.message}` : res.error, res.ok ? (approve ? "success" : "info") : "error");
  }

  async function publishListing() {
    if (!listTitle.trim() || !listPrice || Number(listPrice) <= 0) {
      flash("Title and valid selling price required", "error");
      return;
    }
    if (listTitle.toLowerCase().includes("fail")) {
      flash("Listing failed policy check", "error");
      return;
    }
    setBusy("list");
    const res = await mockApiCall({
      endpoint: "POST /seller/listings",
      mode: pathMode,
      payload: { listTitle, listPrice, listCost, listStock, listCat, listDesc },
      failMessage: "Could not publish listing",
      successMessage: "Listing live in catalog",
      onSuccess: () => {
        const price = Number(listPrice);
        const cost = Number(listCost) || Math.round(price * 0.4);
        const stock = Math.max(0, Number(listStock) || 0);
        const p: Product = {
          id: `p-${Date.now().toString(36)}`,
          title: listTitle.trim(),
          price,
          mrp: Math.round(price * 1.4),
          cost,
          category: listCat,
          rating: 0,
          reviews: 0,
          express: false,
          status: stock > 0 ? "Active" : "Out of stock",
          description: listDesc.trim() || "Seller-listed product · ships from warehouse",
          seller: "Your shop",
          hue: "from-teal-400/20 to-slate-600/20",
          stock,
          unitsSold: 0,
          ownedBySeller: true,
        };
        setProducts((prev) => [p, ...prev]);
        setListTitle("");
        setListPrice("");
        setListCost("");
        setListStock("20");
        setListDesc("");
        return p;
      },
    });
    setBusy(null);
    flash(res.ok ? `${res.message}` : res.error, res.ok ? "success" : "error");
    if (res.ok) setSellerPage("s-listings");
  }

  function saveInventory(id: string) {
    const stock = Number(stockEdits[id]);
    const price = Number(priceEdits[id]);
    if (stockEdits[id] != null && (Number.isNaN(stock) || stock < 0)) {
      flash("Stock must be 0 or more", "error");
      return;
    }
    if (priceEdits[id] != null && (Number.isNaN(price) || price <= 0)) {
      flash("Price must be positive", "error");
      return;
    }
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextStock = stockEdits[id] != null ? stock : p.stock;
        const nextPrice = priceEdits[id] != null ? price : p.price;
        return {
          ...p,
          stock: nextStock,
          price: nextPrice,
          status:
            nextStock === 0
              ? "Out of stock"
              : p.status === "Suspended"
                ? "Suspended"
                : "Active",
        };
      })
    );
    flash("Inventory & price saved", "success");
  }

  async function shopperReturn(id: string) {
    const o = orders.find((x) => x.id === id);
    if (!o || (o.status !== "Delivered" && o.status !== "Shipped")) {
      flash("Only shipped/delivered orders can be returned", "error");
      return;
    }
    setBusy(`sret-${id}`);
    const res = await mockApiCall({
      endpoint: `POST /shop/returns/${id}`,
      mode: pathMode,
      payload: { id },
      failMessage: "Return not eligible",
      successMessage: "Return requested - seller will review",
      onSuccess: () => {
        setOrders((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, status: "Returned", eta: "Awaiting seller review" } : x
          )
        );
        return true;
      },
    });
    setBusy(null);
    flash(res.ok ? res.message : res.error, res.ok ? "success" : "error");
  }

  // ─── Toast strip ───────────────────────────────────────────────────────
  const toastEl = toast && (
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
  );

  const roleSwitcher = (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 px-2 py-1.5">
      <UserRound className="h-4 w-4 text-muted-foreground" />
      <select
        value={roleId}
        disabled={!canSwitchRoles}
        title={
          canSwitchRoles
            ? "App admin: switch Shopper / Seller / Ops portals"
            : "Your account can only use this role"
        }
        onChange={(e) => {
          onRoleChange(e.target.value);
          const r = spec.roles.find((x) => x.id === e.target.value);
          flash(
            `Switched to ${r?.label} · ${
              resolvePortal(e.target.value, r?.label || "") === "seller"
                ? "Seller Hub"
                : resolvePortal(e.target.value, r?.label || "") === "ops"
                  ? "Ops desk"
                  : "Storefront"
            }`,
            "info"
          );
        }}
        className="max-w-[9rem] bg-transparent text-xs font-semibold outline-none sm:max-w-[12rem] sm:text-sm disabled:opacity-60"
      >
        {spec.roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // SELLER HUB - completely separate portal
  // ═══════════════════════════════════════════════════════════════════════
  if (portal === "seller") {
    const nav: Array<{ id: SellerPage; label: string; icon: typeof Home; badge?: number }> = [
      { id: "s-home", label: "Dashboard", icon: Home },
      { id: "s-orders", label: "Orders", icon: Package, badge: finance.pendingCount || undefined },
      { id: "s-listings", label: "Catalog", icon: LayoutGrid },
      { id: "s-add", label: "Add product", icon: Plus },
      { id: "s-inventory", label: "Inventory", icon: Warehouse, badge: finance.lowStock.length || undefined },
      { id: "s-returns", label: "Returns", icon: RotateCcw, badge: finance.returnCount || undefined },
      { id: "s-payments", label: "Payments & P&L", icon: IndianRupee },
      { id: "s-performance", label: "Performance", icon: BarChart3 },
      { id: "s-settings", label: "Settings", icon: Settings },
    ];

    return (
      <div
        className={cn(
          "flex min-h-0 flex-col overflow-hidden bg-slate-50 text-foreground dark:bg-background",
          fullScreen ? "h-full max-h-full flex-1" : "h-full min-h-[560px] rounded-xl border"
        )}
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-navy px-3 py-2.5 text-white md:px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-teal/20 text-accent-teal">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight">
                {brand} <span className="font-normal text-white/70">Seller Hub</span>
              </p>
              <p className="text-[10px] text-white/60">
                Listings · fulfilment · settlements - not the shopper storefront
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {roleSwitcher}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => {
                const shopper = spec.roles.find(
                  (r) => r.isDefault || /buyer|shopper|customer/i.test(r.id)
                );
                if (shopper) onRoleChange(shopper.id);
                else flash("No shopper role in this demo", "info");
              }}
            >
              Open storefront
            </Button>
          </div>
        </header>
        {toastEl}
        {busy && (
          <div className="flex items-center gap-2 bg-accent-teal/10 px-4 py-1.5 text-xs text-accent-teal">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {busy}
          </div>
        )}

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Seller left nav - industry standard hub layout */}
          <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sell
              </p>
              {nav.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSellerPage(n.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
                    sellerPage === n.id
                      ? "bg-accent-teal/15 font-semibold text-accent-teal"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <n.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{n.label}</span>
                  {n.badge != null && n.badge > 0 && (
                    <span className="rounded-full bg-cta-amber px-1.5 text-[10px] font-bold text-navy">
                      {n.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="border-t border-border p-3 text-[10px] text-muted-foreground">
              Net settlement (demo):{" "}
              <strong className="text-foreground">{inr(finance.net)}</strong>
            </div>
          </aside>

          {/* Mobile seller tabs */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-card px-2 py-1.5 md:hidden [scrollbar-width:none]">
              {nav.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSellerPage(n.id)}
                  className={cn(
                    "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                    sellerPage === n.id
                      ? "bg-accent-teal/15 text-accent-teal"
                      : "text-muted-foreground"
                  )}
                >
                  {n.label}
                  {n.badge ? ` (${n.badge})` : ""}
                </button>
              ))}
            </div>

            <main className="min-h-0 flex-1 overflow-y-auto p-3 md:p-5">
              {/* DASHBOARD */}
              {sellerPage === "s-home" && (
                <div className="mx-auto max-w-5xl space-y-5">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Seller dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                      Business health for <strong>Your shop</strong> on {brand}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Kpi
                      label="Pending fulfilment"
                      value={String(finance.pendingCount)}
                      hint="Pack or ship now"
                      onClick={() => setSellerPage("s-orders")}
                    />
                    <Kpi
                      label="Gross sales (settled path)"
                      value={inr(finance.gross)}
                      hint="Before fees & COGS"
                      onClick={() => setSellerPage("s-payments")}
                    />
                    <Kpi
                      label="Est. net profit"
                      value={inr(finance.net)}
                      hint="Gross − fees − COGS − return drag"
                      onClick={() => setSellerPage("s-payments")}
                      positive={finance.net >= 0}
                    />
                    <Kpi
                      label="Return rate"
                      value={`${finance.returnRate}%`}
                      hint={`${finance.returnCount} returns`}
                      onClick={() => setSellerPage("s-returns")}
                    />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <Card className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="font-semibold">Orders needing action</h2>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setSellerPage("s-orders")}
                        >
                          View all
                        </Button>
                      </div>
                      {sellerOrders
                        .filter((o) => o.status === "Placed" || o.status === "Packed")
                        .slice(0, 4)
                        .map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between border-t border-border py-2 text-sm"
                          >
                            <span>
                              <strong>{o.id}</strong> · {o.title}
                              <span className="block text-xs text-muted-foreground">
                                {o.status} · {inr(o.amount)}
                              </span>
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="cta"
                              onClick={() => void sellerAdvanceOrder(o.id)}
                            >
                              {o.status === "Placed" ? "Mark packed" : "Mark shipped"}
                            </Button>
                          </div>
                        ))}
                      {!sellerOrders.some(
                        (o) => o.status === "Placed" || o.status === "Packed"
                      ) && (
                        <p className="text-sm text-muted-foreground">Queue clear 🎉</p>
                      )}
                    </Card>

                    <Card className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="font-semibold">Inventory alerts</h2>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setSellerPage("s-inventory")}
                        >
                          Manage
                        </Button>
                      </div>
                      {finance.oos.map((p) => (
                        <p key={p.id} className="border-t border-border py-2 text-sm text-red-700">
                          OOS · {p.title}
                        </p>
                      ))}
                      {finance.lowStock.map((p) => (
                        <p
                          key={p.id}
                          className="border-t border-border py-2 text-sm text-amber-800"
                        >
                          Low ({p.stock}) · {p.title}
                        </p>
                      ))}
                      {!finance.oos.length && !finance.lowStock.length && (
                        <p className="text-sm text-muted-foreground">Stock levels healthy</p>
                      )}
                    </Card>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="cta" onClick={() => setSellerPage("s-add")}>
                      <Plus className="h-4 w-4" /> Add product
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setSellerPage("s-payments")}
                    >
                      View P&L
                    </Button>
                  </div>
                </div>
              )}

              {/* ADD PRODUCT */}
              {sellerPage === "s-add" && (
                <div className="mx-auto max-w-lg space-y-4">
                  <h1 className="text-2xl font-bold">Add product</h1>
                  <p className="text-sm text-muted-foreground">
                    Creates a live catalog listing owned by your shop. Shoppers will see it on the
                    storefront once Active.
                  </p>
                  <Card className="space-y-3 p-5">
                    <Field label="Title *">
                      <Input
                        value={listTitle}
                        onChange={(e) => setListTitle(e.target.value)}
                        placeholder="e.g. Ceramic pour-over set"
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                        rows={3}
                        value={listDesc}
                        onChange={(e) => setListDesc(e.target.value)}
                        placeholder="What the buyer should know"
                      />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Selling price ₹ *">
                        <Input
                          type="number"
                          value={listPrice}
                          onChange={(e) => setListPrice(e.target.value)}
                        />
                      </Field>
                      <Field label="Your cost ₹ (for P&L)">
                        <Input
                          type="number"
                          value={listCost}
                          onChange={(e) => setListCost(e.target.value)}
                          placeholder="COGS"
                        />
                      </Field>
                      <Field label="Opening stock *">
                        <Input
                          type="number"
                          value={listStock}
                          onChange={(e) => setListStock(e.target.value)}
                        />
                      </Field>
                      <Field label="Category">
                        <select
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                          value={listCat}
                          onChange={(e) => setListCat(e.target.value)}
                        >
                          {CATEGORIES.filter((c) => c !== "All").map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    {listPrice && listCost && Number(listPrice) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Gross margin ≈{" "}
                        {Math.round(
                          ((Number(listPrice) - Number(listCost || 0)) / Number(listPrice)) * 100
                        )}
                        % before marketplace fees (~12%)
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="cta"
                      disabled={Boolean(busy)}
                      onClick={() => void publishListing()}
                    >
                      {busy === "list" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Publish to storefront
                    </Button>
                  </Card>
                </div>
              )}

              {/* CATALOG / LISTINGS */}
              {sellerPage === "s-listings" && (
                <div className="mx-auto max-w-4xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold">Your catalog</h1>
                    <Button type="button" variant="cta" size="sm" onClick={() => setSellerPage("s-add")}>
                      <Plus className="h-4 w-4" /> Add product
                    </Button>
                  </div>
                  {sellerSkus.map((p) => (
                    <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-semibold">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.category} · Sell {inr(p.price)} · Cost {inr(p.cost)} · Stock {p.stock} ·
                          Sold {p.unitsSold}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={cn(
                            p.status === "Active" && "bg-emerald-100 text-emerald-800",
                            p.status === "Out of stock" && "bg-amber-100 text-amber-900",
                            p.status === "Suspended" && "bg-red-100 text-red-800"
                          )}
                        >
                          {p.status}
                        </Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSellerPage("s-inventory");
                            setStockEdits((e) => ({ ...e, [p.id]: String(p.stock) }));
                            setPriceEdits((e) => ({ ...e, [p.id]: String(p.price) }));
                          }}
                        >
                          Edit stock/price
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* INVENTORY */}
              {sellerPage === "s-inventory" && (
                <div className="mx-auto max-w-4xl space-y-3">
                  <h1 className="text-2xl font-bold">Inventory</h1>
                  <p className="text-sm text-muted-foreground">
                    Update on-hand units and selling price. Zero stock auto-marks Out of stock.
                  </p>
                  {sellerSkus.map((p) => (
                    <Card key={p.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
                      <div>
                        <p className="font-semibold">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU {p.id} · {p.status}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="text-xs">
                          Stock
                          <Input
                            type="number"
                            className="mt-1 w-24"
                            value={stockEdits[p.id] ?? String(p.stock)}
                            onChange={(e) =>
                              setStockEdits((s) => ({ ...s, [p.id]: e.target.value }))
                            }
                          />
                        </label>
                        <label className="text-xs">
                          Price ₹
                          <Input
                            type="number"
                            className="mt-1 w-28"
                            value={priceEdits[p.id] ?? String(p.price)}
                            onChange={(e) =>
                              setPriceEdits((s) => ({ ...s, [p.id]: e.target.value }))
                            }
                          />
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="cta"
                          onClick={() => saveInventory(p.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* ORDERS FULFILMENT */}
              {sellerPage === "s-orders" && (
                <div className="mx-auto max-w-4xl space-y-3">
                  <h1 className="text-2xl font-bold">Orders to fulfil</h1>
                  <p className="text-sm text-muted-foreground">
                    Only orders for your SKUs. Flow: Placed → Packed → Shipped → Out for delivery →
                    Delivered.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(["Placed", "Packed", "Shipped", "Out for delivery", "Delivered"] as const).map(
                      (s) => (
                        <Badge key={s} className="bg-muted font-normal">
                          {s}: {sellerOrders.filter((o) => o.status === s).length}
                        </Badge>
                      )
                    )}
                  </div>
                  {sellerOrders.map((o) => (
                    <Card key={o.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {o.placedAt} · {o.id}
                          </p>
                          <p className="font-semibold">{o.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Ship to {o.address} · GMV {inr(o.amount)} · Fee {o.feePct}%
                          </p>
                          <ul className="mt-1 text-xs text-muted-foreground">
                            {o.lines.map((l) => (
                              <li key={l.productId + l.title}>
                                {l.qty}× {l.title} @ {inr(l.unitPrice)}
                              </li>
                            ))}
                          </ul>
                          <Badge className="mt-2 bg-muted">{o.status}</Badge>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {o.status !== "Delivered" &&
                            o.status !== "Returned" &&
                            o.status !== "Cancelled" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="cta"
                                disabled={Boolean(busy)}
                                onClick={() => void sellerAdvanceOrder(o.id)}
                              >
                                <PackageCheck className="h-3.5 w-3.5" />
                                Advance status
                              </Button>
                            )}
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => flash(`Label printed for ${o.id} (demo)`, "success")}
                          >
                            Print label
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* RETURNS */}
              {sellerPage === "s-returns" && (
                <div className="mx-auto max-w-3xl space-y-3">
                  <h1 className="text-2xl font-bold">Returns desk</h1>
                  <p className="text-sm text-muted-foreground">
                    Approve refunds (hits P&L) or reject with reason. Real seller hubs treat this
                    as a separate queue from new orders.
                  </p>
                  {sellerOrders
                    .filter((o) => o.status === "Returned" || o.status === "Delivered")
                    .map((o) => (
                      <Card key={o.id} className="space-y-2 p-4">
                        <div className="flex flex-wrap justify-between gap-2">
                          <div>
                            <p className="font-semibold">
                              {o.id} · {o.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {o.status} · {inr(o.amount)} · {o.eta}
                            </p>
                          </div>
                          <Badge className="bg-muted">{o.status}</Badge>
                        </div>
                        {o.status === "Delivered" && (
                          <>
                            <Input
                              placeholder="Return reason (customer)"
                              value={returnReason[o.id] || ""}
                              onChange={(e) =>
                                setReturnReason((r) => ({ ...r, [o.id]: e.target.value }))
                              }
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="cta"
                                onClick={() => void acceptReturn(o.id, true)}
                              >
                                Approve return
                              </Button>
                            </div>
                          </>
                        )}
                        {o.status === "Returned" && (
                          <p className="text-xs text-amber-800">
                            Refund queued · reverse logistics + fee impact shown in Payments
                          </p>
                        )}
                      </Card>
                    ))}
                </div>
              )}

              {/* PAYMENTS & P&L */}
              {sellerPage === "s-payments" && (
                <div className="mx-auto max-w-3xl space-y-4">
                  <h1 className="text-2xl font-bold">Payments & P&amp;L</h1>
                  <p className="text-sm text-muted-foreground">
                    Settlement view: what sold, what the marketplace kept, what goods cost you, and
                    return drag - like Seller Hub payments + business reports.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card className="p-4">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Gross merchandise (path)
                      </p>
                      <p className="mt-1 text-2xl font-bold text-emerald-700">
                        {inr(finance.gross)}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Marketplace fees
                      </p>
                      <p className="mt-1 text-2xl font-bold text-red-600">−{inr(finance.fees)}</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Cost of goods
                      </p>
                      <p className="mt-1 text-2xl font-bold text-red-600">−{inr(finance.cogs)}</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Return / reverse drag
                      </p>
                      <p className="mt-1 text-2xl font-bold text-red-600">
                        −{inr(finance.returnLoss)}
                      </p>
                    </Card>
                  </div>
                  <Card
                    className={cn(
                      "p-5",
                      finance.net >= 0 ? "border-emerald-300/50 bg-emerald-50/40" : "border-red-300/50 bg-red-50/40"
                    )}
                  >
                    <p className="text-sm font-medium text-muted-foreground">
                      Estimated net (demo)
                    </p>
                    <p
                      className={cn(
                        "text-3xl font-bold",
                        finance.net >= 0 ? "text-emerald-800" : "text-red-700"
                      )}
                    >
                      {inr(finance.net)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Net = Gross − fees − COGS − return drag. Next settlement cycle: demo T+7.
                    </p>
                    <Button
                      type="button"
                      className="mt-3"
                      variant="secondary"
                      onClick={() =>
                        flash(
                          `Settlement report exported · net ${inr(finance.net)} (demo CSV)`,
                          "success"
                        )
                      }
                    >
                      Export settlement report
                    </Button>
                  </Card>
                  <Card className="divide-y p-0">
                    <p className="p-3 text-sm font-semibold">Recent seller orders (P&amp;L impact)</p>
                    {sellerOrders.map((o) => {
                      const fee = (o.amount * o.feePct) / 100;
                      const lineCogs = o.lines.reduce((s, l) => {
                        const prod = products.find((p) => p.id === l.productId);
                        return s + (prod?.cost || 0) * l.qty;
                      }, 0);
                      return (
                        <div
                          key={o.id}
                          className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm"
                        >
                          <span>
                            {o.id} · {o.status}
                          </span>
                          <span className="text-muted-foreground">
                            GMV {inr(o.amount)} · fee −{inr(fee)} · COGS −{inr(lineCogs)}
                          </span>
                        </div>
                      );
                    })}
                  </Card>
                </div>
              )}

              {/* PERFORMANCE */}
              {sellerPage === "s-performance" && (
                <div className="mx-auto max-w-3xl space-y-4">
                  <h1 className="text-2xl font-bold">Performance</h1>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Kpi label="SKUs live" value={String(sellerSkus.filter((p) => p.status === "Active").length)} />
                    <Kpi label="Units sold (lifetime)" value={String(sellerSkus.reduce((s, p) => s + p.unitsSold, 0))} />
                    <Kpi label="Return rate" value={`${finance.returnRate}%`} />
                  </div>
                  <Card className="p-4">
                    <h2 className="font-semibold">Top SKUs by units</h2>
                    {[...sellerSkus]
                      .sort((a, b) => b.unitsSold - a.unitsSold)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex justify-between border-t border-border py-2 text-sm"
                        >
                          <span>{p.title}</span>
                          <span className="text-muted-foreground">
                            {p.unitsSold} sold · {p.stock} left · {inr(p.price)}
                          </span>
                        </div>
                      ))}
                  </Card>
                </div>
              )}

              {/* SETTINGS */}
              {sellerPage === "s-settings" && (
                <div className="mx-auto max-w-md space-y-4">
                  <h1 className="text-2xl font-bold">Seller settings</h1>
                  <Card className="space-y-3 p-5">
                    <p className="text-sm">
                      Store name: <strong>Your shop</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Bank settlement account: demo ·•••• 8821 (mock)
                    </p>
                    <label className="block text-sm">
                      API sandbox
                      <select
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
                        value={pathMode}
                        onChange={(e) => setPathMode(e.target.value as MockPathMode)}
                      >
                        <option value="auto">Realistic</option>
                        <option value="always_ok">Always succeed</option>
                        <option value="always_fail">Always fail</option>
                      </select>
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const shopper = spec.roles.find(
                          (r) => r.isDefault || /buyer|shopper|customer/i.test(r.id)
                        );
                        if (shopper) onRoleChange(shopper.id);
                      }}
                    >
                      Switch to shopper storefront
                    </Button>
                  </Card>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // OPS PORTAL
  // ═══════════════════════════════════════════════════════════════════════
  if (portal === "ops") {
    return (
      <div
        className={cn(
          "flex min-h-0 flex-col overflow-hidden bg-background",
          fullScreen ? "h-full max-h-full flex-1" : "h-full min-h-[560px] rounded-xl border"
        )}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-slate-900 px-4 py-3 text-white">
          <div>
            <p className="font-bold">{brand} Ops</p>
            <p className="text-[10px] text-white/60">Trust & safety · not seller or shopper UI</p>
          </div>
          {roleSwitcher}
        </header>
        {toastEl}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <h1 className="text-2xl font-bold">Ops desk</h1>
            <h2 className="text-sm font-semibold text-muted-foreground">Suspended listings</h2>
            {products
              .filter((p) => p.status === "Suspended")
              .map((p) => (
                <Card key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <span>
                    {p.title} · {p.seller}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="cta"
                    onClick={() => {
                      setProducts((prev) =>
                        prev.map((x) =>
                          x.id === p.id ? { ...x, status: x.stock > 0 ? "Active" : "Out of stock" } : x
                        )
                      );
                      flash("Listing reinstated", "success");
                    }}
                  >
                    Reinstate
                  </Button>
                </Card>
              ))}
            <h2 className="pt-2 text-sm font-semibold text-muted-foreground">Return cases</h2>
            {orders
              .filter((o) => o.status === "Returned")
              .map((o) => (
                <Card key={o.id} className="p-3 text-sm">
                  {o.id} · {o.title} · {inr(o.amount)} · {o.eta}
                </Card>
              ))}
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SHOPPER STOREFRONT
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-background text-foreground",
        fullScreen ? "h-full max-h-full flex-1" : "h-full min-h-[560px] rounded-xl border"
      )}
    >
      <header className="z-30 shrink-0 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 md:px-5">
          <button type="button" onClick={() => goShop("home")} className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
            >
              <ShoppingBag className="h-4 w-4" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-bold" style={{ color: primary }}>
                {brand}
              </span>
              <span className="block text-[10px] text-muted-foreground">Shopper storefront</span>
            </span>
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              goShop("browse");
              flash(search ? `Results for “${search}”` : "Browsing", "info");
            }}
            className="flex min-w-[10rem] flex-1 items-center overflow-hidden rounded-xl border border-border bg-muted/40 focus-within:ring-2 focus-within:ring-accent-teal/25"
          >
            <Search className="ml-3 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${brand}…`}
              className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"
            />
            <Button type="submit" size="sm" variant="cta" className="m-1">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-1.5">
            {roleSwitcher}
            <button
              type="button"
              onClick={() => goShop("orders")}
              className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted sm:inline"
            >
              Orders
            </button>
            <button
              type="button"
              onClick={() => goShop("cart")}
              className="relative inline-flex items-center gap-1 rounded-xl border border-border bg-accent-teal/10 px-2.5 py-1.5 text-sm font-semibold text-accent-teal"
            >
              <ShoppingCart className="h-4 w-4" />
              Bag
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cta-amber text-[10px] font-bold text-navy">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-border/60 px-2 py-1.5 md:px-5 [scrollbar-width:none]">
          {(
            [
              ["home", "Home"],
              ["browse", "Shop"],
              ["deals", "Deals"],
              ["orders", "Orders"],
              ["saved", "Saved"],
              ["help", "Help"],
              ["account", "Account"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => goShop(id)}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                shopPage === id
                  ? "bg-accent-teal/15 text-accent-teal"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
          {CATEGORIES.filter((c) => c !== "All").map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c);
                goShop("browse");
              }}
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              {c}
            </button>
          ))}
        </div>
      </header>
      {toastEl}
      {busy && (
        <div className="flex items-center gap-2 bg-accent-teal/10 px-4 py-1.5 text-xs text-accent-teal">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {busy}
        </div>
      )}

      <main className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-6">
        {shopPage === "home" && (
          <div className="mx-auto max-w-6xl space-y-6 px-3 py-5 md:px-5">
            <section
              className="rounded-3xl p-6 text-white md:p-10"
              style={{
                background: `linear-gradient(135deg, ${primary}, #1e293b 55%, ${accent})`,
              }}
            >
              <h1 className="max-w-xl text-2xl font-bold md:text-4xl">
                Shop with clarity
              </h1>
              <p className="mt-2 max-w-lg text-sm text-white/80">
                Storefront for shoppers. Sellers use a separate Seller Hub (switch role above).
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="cta" onClick={() => goShop("browse")}>
                  Browse <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => goShop("deals")}
                >
                  Deals
                </Button>
              </div>
            </section>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {filtered
                .filter((p) => p.status === "Active")
                .slice(0, 8)
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
          </div>
        )}

        {(shopPage === "browse" || shopPage === "deals") && (
          <div className="mx-auto grid max-w-6xl gap-4 px-3 py-5 md:grid-cols-[180px_1fr] md:px-5">
            <aside className="h-fit space-y-1 rounded-2xl border bg-card p-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "w-full rounded-lg px-2 py-2 text-left text-sm",
                    category === c ? "bg-accent-teal/15 font-semibold text-accent-teal" : "hover:bg-muted"
                  )}
                >
                  {c}
                </button>
              ))}
            </aside>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(shopPage === "deals"
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
          </div>
        )}

        {shopPage === "pdp" && pdp && (
          <div className="mx-auto grid max-w-5xl gap-6 px-3 py-5 md:grid-cols-2 md:px-5">
            <div className={cn("flex min-h-[260px] items-center justify-center rounded-3xl bg-gradient-to-br", pdp.hue)}>
              <Package className="h-20 w-20 text-navy/25" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">{pdp.title}</h1>
              <p className="text-sm text-muted-foreground">
                {pdp.rating} ★ · Sold by {pdp.seller}
              </p>
              <p className="text-3xl font-bold">{inr(pdp.price)}</p>
              <p className="text-sm text-muted-foreground">{pdp.description}</p>
              {pdp.express && (
                <p className="flex items-center gap-1 text-sm font-medium text-accent-teal">
                  <Zap className="h-4 w-4" /> Express delivery
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="cta" disabled={pdp.status !== "Active"} onClick={() => addToCart(pdp.id)}>
                  Add to bag
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pdp.status !== "Active"}
                  onClick={() => {
                    addToCart(pdp.id);
                    goShop("checkout");
                  }}
                >
                  Buy now
                </Button>
                <Button type="button" variant="secondary" onClick={() => toggleSaved(pdp.id)}>
                  <Heart className={cn("h-4 w-4", saved.includes(pdp.id) && "fill-red-500 text-red-500")} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {shopPage === "cart" && (
          <div className="mx-auto grid max-w-5xl gap-4 px-3 py-5 lg:grid-cols-[1fr_280px] md:px-5">
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">Your bag</h1>
              {!cartLines.length && (
                <Card className="p-8 text-center">
                  <p>Bag empty</p>
                  <Button type="button" className="mt-3" variant="cta" onClick={() => goShop("browse")}>
                    Shop
                  </Button>
                </Card>
              )}
              {cartLines.map((l) => (
                <Card key={l.productId} className="flex flex-wrap gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{l.product.title}</p>
                    <p className="text-sm font-bold">{inr(l.product.price)}</p>
                    <select
                      className="mt-2 rounded-lg border px-2 py-1 text-sm"
                      value={l.qty}
                      onChange={(e) => setQty(l.productId, Number(e.target.value))}
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n === 0 ? "Remove" : `Qty ${n}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="font-bold">{inr(l.product.price * l.qty)}</p>
                </Card>
              ))}
            </div>
            <Card className="h-fit space-y-2 p-4">
              <p className="text-2xl font-bold">{inr(cartTotal)}</p>
              <Button type="button" variant="cta" className="w-full" disabled={!cartLines.length} onClick={() => goShop("checkout")}>
                Checkout
              </Button>
            </Card>
          </div>
        )}

        {shopPage === "checkout" && (
          <div className="mx-auto max-w-md space-y-3 px-3 py-5">
            <h1 className="text-2xl font-bold">Checkout</h1>
            <Card className="space-y-2 p-4">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
              <textarea
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              {(["upi", "card", "cod"] as const).map((id) => (
                <label key={id} className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={pay === id} onChange={() => setPay(id)} />
                  {id === "upi" ? "UPI" : id === "card" ? "Card" : "Cash on delivery"}
                </label>
              ))}
              <p className="font-bold">Total {inr(cartTotal)}</p>
              <Button type="button" variant="cta" className="w-full" disabled={Boolean(busy)} onClick={() => void placeOrder()}>
                Place order
              </Button>
            </Card>
          </div>
        )}

        {shopPage === "orders" && (
          <div className="mx-auto max-w-2xl space-y-3 px-3 py-5">
            <h1 className="text-2xl font-bold">Your orders</h1>
            {orders.map((o) => (
              <Card key={o.id} className="p-4">
                <p className="text-xs text-muted-foreground">{o.id}</p>
                <p className="font-semibold">{o.title}</p>
                <p className="text-sm text-muted-foreground">
                  {o.status} · {inr(o.amount)} · {o.eta}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => void shopperAdvance(o.id)}>
                    Track
                  </Button>
                  {(o.status === "Delivered" || o.status === "Shipped") && (
                    <Button type="button" size="sm" variant="secondary" onClick={() => void shopperReturn(o.id)}>
                      Return
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {shopPage === "returns" && (
          <div className="mx-auto max-w-md space-y-3 px-3 py-5">
            <h1 className="text-2xl font-bold">Returns</h1>
            {orders
              .filter((o) => o.status === "Returned" || o.status === "Delivered")
              .map((o) => (
                <Card key={o.id} className="flex justify-between p-3 text-sm">
                  <span>
                    {o.title} · {o.status}
                  </span>
                  {o.status === "Delivered" && (
                    <Button type="button" size="sm" onClick={() => void shopperReturn(o.id)}>
                      Return
                    </Button>
                  )}
                </Card>
              ))}
          </div>
        )}

        {shopPage === "saved" && (
          <div className="mx-auto max-w-5xl space-y-3 px-3 py-5">
            <h1 className="text-2xl font-bold">Saved</h1>
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

        {shopPage === "addresses" && (
          <div className="mx-auto max-w-md space-y-3 px-3 py-5">
            <h1 className="text-2xl font-bold">Address</h1>
            <Card className="space-y-2 p-4">
              <textarea
                className="w-full rounded-xl border px-3 py-2 text-sm"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Button type="button" variant="cta" onClick={() => { flash("Saved", "success"); goShop("home"); }}>
                Save
              </Button>
            </Card>
          </div>
        )}

        {shopPage === "help" && (
          <div className="mx-auto max-w-md space-y-2 px-3 py-5">
            <h1 className="text-2xl font-bold">Help</h1>
            {[
              ["Track order", "orders"],
              ["Returns", "returns"],
              ["Address", "addresses"],
            ].map(([label, id]) => (
              <button
                key={label}
                type="button"
                onClick={() => goShop(id as ShopPage)}
                className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm font-medium"
              >
                {label}
                <ChevronRight className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}

        {shopPage === "account" && (
          <div className="mx-auto max-w-md space-y-3 px-3 py-5">
            <h1 className="text-2xl font-bold">Account</h1>
            <p className="text-sm text-muted-foreground">
              You are in the <strong>shopper storefront</strong>. Switch role to Seller for Seller Hub.
            </p>
            <Card className="space-y-2 p-4">
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={pathMode}
                onChange={(e) => setPathMode(e.target.value as MockPathMode)}
              >
                <option value="auto">API: realistic</option>
                <option value="always_ok">API: always OK</option>
                <option value="always_fail">API: always fail</option>
              </select>
              {spec.roles
                .filter((r) => /seller/i.test(r.id + r.label))
                .map((r) => (
                  <Button
                    key={r.id}
                    type="button"
                    variant="cta"
                    className="w-full"
                    onClick={() => onRoleChange(r.id)}
                  >
                    Open Seller Hub as {r.label}
                  </Button>
                ))}
            </Card>
          </div>
        )}

        <footer className="mt-8 border-t border-border bg-card px-4 py-6 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {brand} · Shopper storefront · Sellers use Seller Hub
        </footer>
      </main>

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
            onClick={() => goShop(id)}
            className={cn(
              "relative flex flex-1 flex-col items-center py-2 text-[10px]",
              shopPage === id ? "text-accent-teal" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  onClick,
  positive,
}: {
  label: string;
  value: string;
  hint?: string;
  onClick?: () => void;
  positive?: boolean;
}) {
  const inner = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold",
          positive === true && "text-emerald-700",
          positive === false && "text-red-600"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left">
        <Card className="h-full p-4 transition hover:border-accent-teal/40">{inner}</Card>
      </button>
    );
  }
  return <Card className="p-4">{inner}</Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
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
  return (
    <Card className="flex flex-col overflow-hidden p-0 transition hover:border-accent-teal/40">
      <button type="button" onClick={onOpen} className="text-left">
        <div className={cn("flex h-32 items-center justify-center bg-gradient-to-br", product.hue)}>
          <Package className="h-12 w-12 text-navy/25" />
        </div>
        <div className="space-y-1 p-3">
          <p className="line-clamp-2 text-sm font-semibold">{product.title}</p>
          <p className="text-base font-bold">
            {inr(product.price)}{" "}
            <span className="text-xs font-normal text-muted-foreground line-through">
              {inr(product.mrp)}
            </span>
          </p>
        </div>
      </button>
      <div className="mt-auto flex gap-1 border-t p-2">
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
