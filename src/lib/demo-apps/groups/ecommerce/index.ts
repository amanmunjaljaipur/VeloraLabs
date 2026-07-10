/**
 * Demo app categories: ecommerce
 * Deploy unit: src/lib/demo-apps/groups/ecommerce/
 */

import { ent, type DemoCategoryDef, DEMO_GROUP_LABELS } from "../../types";

const G = DEMO_GROUP_LABELS;

export const CATEGORIES: DemoCategoryDef[] = [
{
    slug: "mass-marketplace",
    name: "Mass Marketplaces (E-commerce)",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "Shop with clarity — fair prices, honest returns",
    description:
      "Original multi-sided marketplace product (Horizon Market): premium Verlin UI with full commerce jobs — search, category browse, product detail, bag, checkout, order tracking, returns, saved items, addresses, help, seller hub (listings, inventory, fulfilment), and ops desk. Not a third-party brand clone.",
    examples: ["Amazon", "Flipkart", "eBay", "Shopify markets"],
    productKind: "ecommerce",
    brandName: "Horizon Market",
    roles: [
      {
        id: "buyer",
        label: "Shopper",
        description: "Browse, save, checkout, track orders, and start returns.",
        canCreate: true,
        isDefault: true,
      },
      {
        id: "seller",
        label: "Seller",
        description: "Publish listings, manage inventory, advance fulfilment.",
        canCreate: true,
        canManage: true,
      },
      {
        id: "ops",
        label: "Marketplace ops",
        description: "Reinstate listings and review returns for trust & safety.",
        canManage: true,
      },
      {
        id: "support",
        label: "Customer service",
        description: "Help shoppers with orders, refunds, and account issues.",
        canManage: true,
      },
    ],
    entities: [
      ent(
        "product",
        "Product",
        ["Active", "Out of stock", "Suspended"],
        ["title", "amount", "description", "status"],
        [
          {
            title: "Noise Cancelling Wireless Earbuds Pro",
            amount: 2499,
            description: "Electronics · Best seller",
            status: "Active",
          },
          {
            title: "Premium Yoga Mat 6mm",
            amount: 899,
            description: "Sports",
            status: "Active",
          },
          {
            title: "USB-C 7-in-1 Hub",
            amount: 1299,
            description: "Computers · OOS",
            status: "Out of stock",
          },
          {
            title: "Atomic Habits (Paperback)",
            amount: 399,
            description: "Books",
            status: "Active",
          },
        ]
      ),
      ent(
        "order",
        "Order",
        ["Placed", "Shipped", "Out for delivery", "Delivered", "Returned", "Cancelled"],
        ["title", "amount", "status"],
        [
          { title: "ORD-10482 Earbuds", amount: 2499, status: "Shipped" },
          { title: "ORD-10391 Yoga mat pack", amount: 1498, status: "Delivered" },
          { title: "ORD-10220 Hub return", amount: 1299, status: "Returned" },
          { title: "ORD-10501 T-shirts", amount: 799, status: "Placed" },
        ]
      ),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Hero, categories, deals, recommended" },
      { id: "browse", title: "Shop", type: "list", entityId: "product", description: "Catalog + filters" },
      { id: "pdp", title: "Product", type: "detail", entityId: "product", description: "Detail · bag · buy · save" },
      { id: "cart", title: "Bag", type: "list", entityId: "order", description: "Qty · subtotal · checkout" },
      { id: "checkout", title: "Checkout", type: "form", entityId: "order", description: "Address · pay · place order" },
      { id: "orders", title: "Orders", type: "list", entityId: "order", description: "Track · return" },
      { id: "returns", title: "Returns", type: "board", entityId: "order", description: "Refund flow" },
      { id: "saved", title: "Saved", type: "list", entityId: "product", description: "Wish list" },
      { id: "account", title: "Account", type: "settings", description: "Hub + sandbox" },
      { id: "addresses", title: "Addresses", type: "form", description: "Delivery pin" },
      { id: "help", title: "Help", type: "list", description: "Support hub" },
      { id: "deals", title: "Deals", type: "list", entityId: "product", description: "On sale" },
      { id: "seller", title: "Seller hub", type: "form", entityId: "product", roleIds: ["seller"], description: "New listing" },
      { id: "seller-inventory", title: "Inventory", type: "board", entityId: "product", roleIds: ["seller"], description: "Stock" },
      { id: "seller-orders", title: "Seller orders", type: "board", entityId: "order", roleIds: ["seller"], description: "Fulfilment" },
      { id: "ops", title: "Ops desk", type: "board", entityId: "order", roleIds: ["ops", "support"], description: "Trust & safety" },
    ],
    workflows: [
      {
        id: "wf-buy",
        name: "Shop to door",
        description: "Browse → product → bag → checkout → track",
        roleId: "buyer",
        steps: ["Home", "Shop", "Product", "Bag", "Checkout", "Orders"],
        moduleId: "checkout",
        entityId: "order",
      },
      {
        id: "wf-return",
        name: "Return item",
        description: "Orders → start return",
        roleId: "buyer",
        steps: ["Orders", "Return", "Refund"],
        moduleId: "returns",
        entityId: "order",
      },
      {
        id: "wf-sell",
        name: "List product",
        description: "Seller hub → publish → inventory",
        roleId: "seller",
        steps: ["Seller hub", "Publish", "Inventory"],
        moduleId: "seller",
        entityId: "product",
      },
      {
        id: "wf-fulfil",
        name: "Fulfil order",
        description: "Advance Placed → Delivered",
        roleId: "seller",
        steps: ["Seller orders", "Advance"],
        moduleId: "seller-orders",
        entityId: "order",
      },
      {
        id: "wf-ops",
        name: "Ops reinstate",
        description: "Ops desk reinstates listings",
        roleId: "ops",
        steps: ["Ops desk", "Reinstate"],
        moduleId: "ops",
        entityId: "product",
      },
    ],
  },
  {
    slug: "food-delivery",
    name: "On-Demand Food Delivery",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "Restaurant meals to door",
    description: "Uber Eats-style restaurants, cart, courier dispatch, live order states.",
    examples: ["Uber Eats", "DoorDash", "Swiggy"],
    productKind: "generic",
    brandName: "Verlin Eats",
    roles: [
      { id: "customer", label: "Customer", description: "Order food", canCreate: true, isDefault: true },
      { id: "restaurant", label: "Restaurant", description: "Accept orders", canManage: true, canCreate: true },
      { id: "courier", label: "Courier", description: "Deliver", canManage: true },
    ],
    entities: [
      ent("order", "Order", ["Placed", "Preparing", "On the way", "Delivered", "Cancelled"], ["title", "amount", "description", "status"], [
        { title: "Biryani bowl", amount: 320, description: "Spice Hub", status: "On the way" },
        { title: "Sushi set", amount: 890, description: "Tokyo Local", status: "Preparing" },
        { title: "Salad", amount: 250, description: "Green Bowl", status: "Delivered" },
        { title: "Pizza", amount: 450, description: "Cancelled stock", status: "Cancelled" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Nearby" },
      { id: "orders", title: "Orders", type: "board", entityId: "order", description: "Track" },
      { id: "order", title: "New order", type: "form", entityId: "order", description: "Checkout" },
      { id: "kitchen", title: "Kitchen", type: "board", entityId: "order", roleIds: ["restaurant"], description: "Prep" },
      { id: "dispatch", title: "Dispatch", type: "board", entityId: "order", roleIds: ["courier"], description: "Deliveries" },
      { id: "settings", title: "Settings", type: "settings", description: "Addresses" },
    ],
    workflows: [
      { id: "wf-order", name: "Order meal", description: "Customer orders", roleId: "customer", steps: ["Order", "Track", "Delivered"], moduleId: "order", entityId: "order" },
      { id: "wf-kit", name: "Prepare order", description: "Restaurant preps", roleId: "restaurant", steps: ["Kitchen", "Preparing", "Ready"], moduleId: "kitchen", entityId: "order" },
      { id: "wf-del", name: "Deliver", description: "Courier delivers", roleId: "courier", steps: ["Dispatch", "On the way", "Delivered"], moduleId: "dispatch", entityId: "order" },
    ],
  },
  {
    slug: "grocery-qcommerce",
    name: "Grocery & Quick-Commerce",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "Rapid grocery fulfillment",
    description: "Instacart/Getir-style SKUs, slots, pickers, dark-store stock.",
    examples: ["Instacart", "Getir", "Blinkit"],
    productKind: "generic",
    brandName: "Verlin Fresh",
    roles: [
      { id: "shopper", label: "Customer", description: "Order groceries", canCreate: true, isDefault: true },
      { id: "picker", label: "Picker", description: "Fulfill order", canManage: true },
      { id: "store", label: "Store manager", description: "Stock", canManage: true, canCreate: true },
    ],
    entities: [
      ent("order", "Grocery order", ["Placed", "Picking", "Out for delivery", "Delivered"], ["title", "amount", "status"], [
        { title: "Weekly essentials", amount: 1450, status: "Picking" },
        { title: "Milk & eggs", amount: 220, status: "Out for delivery" },
        { title: "Party pack", amount: 3200, status: "Delivered" },
        { title: "Snacks", amount: 380, status: "Placed" },
      ]),
      ent("sku", "SKU", ["In stock", "Low", "OOS"], ["title", "amount", "status"], [
        { title: "Organic milk 1L", amount: 72, status: "In stock" },
        { title: "Sourdough", amount: 90, status: "Low" },
        { title: "Avocado", amount: 40, status: "OOS" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "10-min delivery" },
      { id: "shop", title: "Shop", type: "list", entityId: "sku", description: "Catalog" },
      { id: "order", title: "Checkout", type: "form", entityId: "order", description: "Place order" },
      { id: "orders", title: "My orders", type: "board", entityId: "order", description: "Track" },
      { id: "pick", title: "Pick queue", type: "board", entityId: "order", roleIds: ["picker"], description: "Fulfill" },
      { id: "stock", title: "Stock", type: "board", entityId: "sku", roleIds: ["store"], description: "Inventory" },
      { id: "settings", title: "Settings", type: "settings", description: "Delivery slot" },
    ],
    workflows: [
      { id: "wf-shop", name: "Order groceries", description: "Customer checks out", roleId: "shopper", steps: ["Shop", "Checkout", "Track"], moduleId: "order", entityId: "order" },
      { id: "wf-pick", name: "Pick order", description: "Picker fulfills", roleId: "picker", steps: ["Pick", "Out for delivery"], moduleId: "pick", entityId: "order" },
      { id: "wf-stock", name: "Restock SKU", description: "Manager restocks", roleId: "store", steps: ["Stock", "In stock"], moduleId: "stock", entityId: "sku" },
    ],
  },
  {
    slug: "secondhand-marketplace",
    name: "Second-Hand Marketplaces",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "P2P used goods",
    description: "Vinted/eBay used: listings, offers, shipping, disputes.",
    examples: ["Vinted", "eBay", "Poshmark"],
    productKind: "generic",
    brandName: "Verlin Reuse",
    roles: [
      { id: "buyer", label: "Buyer", description: "Make offers", canCreate: true, isDefault: true },
      { id: "seller", label: "Seller", description: "List items", canCreate: true, canManage: true },
      { id: "support", label: "Trust support", description: "Disputes", canManage: true },
    ],
    entities: [
      ent("listing", "Listing", ["Active", "Reserved", "Sold", "Removed"], ["title", "amount", "description", "status"], [
        { title: "Vintage denim", amount: 1200, description: "M", status: "Active" },
        { title: "iPhone 12", amount: 18000, description: "Good", status: "Reserved" },
        { title: "Desk lamp", amount: 600, description: "Sold", status: "Sold" },
        { title: "Fake bag", amount: 900, description: "Removed", status: "Removed" },
      ]),
      ent("offer", "Offer", ["Pending", "Accepted", "Declined"], ["title", "amount", "status"], [
        { title: "Offer on denim", amount: 1000, status: "Pending" },
        { title: "Offer on lamp", amount: 550, status: "Accepted" },
      ]),
    ],
    modules: [
      { id: "home", title: "Browse", type: "dashboard", description: "Discover" },
      { id: "listings", title: "Listings", type: "list", entityId: "listing", description: "Items" },
      { id: "sell", title: "Sell item", type: "form", entityId: "listing", roleIds: ["seller", "buyer"], description: "List" },
      { id: "offers", title: "Offers", type: "board", entityId: "offer", description: "Negotiate" },
      { id: "offer", title: "Make offer", type: "form", entityId: "offer", description: "Bid" },
      { id: "support", title: "Disputes", type: "board", entityId: "listing", roleIds: ["support"], description: "Trust" },
      { id: "settings", title: "Settings", type: "settings", description: "Shipping" },
    ],
    workflows: [
      { id: "wf-buy", name: "Make offer", description: "Buyer offers", roleId: "buyer", steps: ["Browse", "Offer"], moduleId: "offer", entityId: "offer" },
      { id: "wf-sell", name: "Sell item", description: "Seller lists", roleId: "seller", steps: ["Sell", "Active", "Sold"], moduleId: "sell", entityId: "listing" },
      { id: "wf-sup", name: "Resolve dispute", description: "Support removes", roleId: "support", steps: ["Disputes", "Remove"], moduleId: "support", entityId: "listing" },
    ],
  },
  {
    slug: "brand-shopping",
    name: "Brand-Specific Shopping Apps",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "DTC brand store",
    description: "Nike-style catalog, sizes, membership, store pickup.",
    examples: ["Nike", "H&M", "Zara", "SHEIN"],
    productKind: "generic",
    brandName: "Verlin Apparel",
    roles: [
      { id: "shopper", label: "Shopper", description: "Browse & buy", canCreate: true, isDefault: true },
      { id: "member", label: "Members club", description: "Early access", canCreate: true, canManage: true },
      { id: "store", label: "Store associate", description: "Pickup orders", canManage: true },
    ],
    entities: [
      ent("product", "Product", ["In stock", "Low stock", "Sold out"], ["title", "amount", "level", "status"], [
        { title: "Runner Pro", amount: 8999, level: "42", status: "In stock" },
        { title: "City Hoodie", amount: 3499, level: "M", status: "Low stock" },
        { title: "Cap classic", amount: 999, level: "OS", status: "Sold out" },
      ]),
      ent("order", "Order", ["Paid", "Packing", "Ready for pickup", "Completed"], ["title", "amount", "status"], [
        { title: "Runner Pro", amount: 8999, status: "Ready for pickup" },
        { title: "Hoodie", amount: 3499, status: "Packing" },
      ]),
    ],
    modules: [
      { id: "home", title: "Shop", type: "dashboard", description: "New drops" },
      { id: "catalog", title: "Catalog", type: "list", entityId: "product", description: "Products" },
      { id: "order", title: "Checkout", type: "form", entityId: "order", description: "Buy" },
      { id: "orders", title: "Orders", type: "board", entityId: "order", description: "Track" },
      { id: "pickup", title: "Store pickup", type: "board", entityId: "order", roleIds: ["store"], description: "Counter" },
      { id: "settings", title: "Membership", type: "settings", description: "Club" },
    ],
    workflows: [
      { id: "wf-buy", name: "Buy product", description: "Shopper checks out", roleId: "shopper", steps: ["Catalog", "Checkout"], moduleId: "order", entityId: "order" },
      { id: "wf-mem", name: "Member drop", description: "Early access", roleId: "member", steps: ["Shop", "Buy"], moduleId: "home" },
      { id: "wf-pick", name: "Hand over pickup", description: "Store completes", roleId: "store", steps: ["Pickup", "Completed"], moduleId: "pickup", entityId: "order" },
    ],
  },
  {
    slug: "loyalty-cashback",
    name: "Loyalty, Coupons & Cashback",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "Rewards & cash back",
    description: "Rakuten-style offers, clipped coupons, cashback ledger.",
    examples: ["Rakuten", "Honey", "Ibotta"],
    productKind: "generic",
    brandName: "Verlin Rewards",
    roles: [
      { id: "member", label: "Member", description: "Clip & earn", canCreate: true, isDefault: true },
      { id: "partner", label: "Brand partner", description: "Create offers", canCreate: true, canManage: true },
      { id: "ops", label: "Rewards ops", description: "Payouts", canManage: true },
    ],
    entities: [
      ent("offer", "Offer", ["Live", "Clipped", "Expired", "Paused"], ["title", "amount", "description", "status"], [
        { title: "10% fashion", amount: 10, description: "Online", status: "Live" },
        { title: "₹100 grocery", amount: 100, description: "Clipped", status: "Clipped" },
        { title: "Weekend travel", amount: 5, description: "Expired", status: "Expired" },
        { title: "Partner draft", amount: 15, description: "Paused", status: "Paused" },
      ]),
      ent("payout", "Cashback", ["Pending", "Paid", "Failed"], ["title", "amount", "status"], [
        { title: "March cashback", amount: 420, status: "Paid" },
        { title: "April pending", amount: 180, status: "Pending" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Earn" },
      { id: "offers", title: "Offers", type: "board", entityId: "offer", description: "Clip" },
      { id: "wallet", title: "Cashback", type: "list", entityId: "payout", description: "Ledger" },
      { id: "create", title: "Create offer", type: "form", entityId: "offer", roleIds: ["partner"], description: "Partner" },
      { id: "ops", title: "Payouts", type: "board", entityId: "payout", roleIds: ["ops"], description: "Ops" },
      { id: "settings", title: "Settings", type: "settings", description: "Linked cards" },
    ],
    workflows: [
      { id: "wf-clip", name: "Clip offer", description: "Member clips", roleId: "member", steps: ["Offers", "Clip"], moduleId: "offers", entityId: "offer" },
      { id: "wf-part", name: "Launch offer", description: "Partner goes live", roleId: "partner", steps: ["Create", "Live"], moduleId: "create", entityId: "offer" },
      { id: "wf-pay", name: "Pay cashback", description: "Ops pays", roleId: "ops", steps: ["Payouts", "Paid"], moduleId: "ops", entityId: "payout" },
    ],
  }
];

export default CATEGORIES;
