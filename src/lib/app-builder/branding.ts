/**
 * Location-aware colors, logos, and product visuals for non-technical shop owners.
 * No external image APIs - pure deterministic design from city + brand.
 */

export interface LocationBrand {
  primaryColor: string;
  secondaryColor: string;
  heroFrom: string;
  heroTo: string;
  motif: string;
  emoji: string;
  landmarkHint: string;
  productEmojis: string[];
}

const DEFAULT_BRAND: LocationBrand = {
  primaryColor: "#0d9488",
  secondaryColor: "#0f766e",
  heroFrom: "#0d9488",
  heroTo: "#0a1628",
  motif: "local",
  emoji: "🏪",
  landmarkHint: "your neighbourhood",
  productEmojis: ["📦", "🎁", "✨", "🛍️", "⭐"],
};

/** City / region keywords → visual identity */
const LOCATION_BRANDS: Array<{ match: RegExp; brand: LocationBrand }> = [
  {
    match: /jaipur|rajasthan|jodhpur|udaipur|pink\s*city/i,
    brand: {
      primaryColor: "#c2410c",
      secondaryColor: "#9a3412",
      heroFrom: "#ea580c",
      heroTo: "#7c2d12",
      motif: "desert-palace",
      emoji: "🕌",
      landmarkHint: "pink city craft lanes",
      productEmojis: ["🏺", "🧵", "🪔", "🪞", "🎨", "📿"],
    },
  },
  {
    match: /mumbai|bombay|pune|maharashtra|thane/i,
    brand: {
      primaryColor: "#0369a1",
      secondaryColor: "#0c4a6e",
      heroFrom: "#0284c7",
      heroTo: "#0c1929",
      motif: "coastal-metro",
      emoji: "🌊",
      landmarkHint: "city by the sea",
      productEmojis: ["🍱", "🥐", "🧥", "📱", "🎁", "☕"],
    },
  },
  {
    match: /delhi|noida|gurgaon|gurugram|ncr|chandni/i,
    brand: {
      primaryColor: "#b91c1c",
      secondaryColor: "#7f1d1d",
      heroFrom: "#dc2626",
      heroTo: "#1c1917",
      motif: "capital",
      emoji: "🏛️",
      landmarkHint: "heart of the capital",
      productEmojis: ["🧥", "📿", "🍲", "📚", "🎁", "🧩"],
    },
  },
  {
    match: /bengaluru|bangalore|karnataka|mysore|mysuru/i,
    brand: {
      primaryColor: "#15803d",
      secondaryColor: "#14532d",
      heroFrom: "#16a34a",
      heroTo: "#052e16",
      motif: "garden-city",
      emoji: "🌳",
      landmarkHint: "garden city lanes",
      productEmojis: ["☕", "🌿", "🍪", "📖", "🎧", "🪴"],
    },
  },
  {
    match: /chennai|madras|tamil|coimbatore|madurai/i,
    brand: {
      primaryColor: "#b45309",
      secondaryColor: "#78350f",
      heroFrom: "#d97706",
      heroTo: "#1c1917",
      motif: "temple-coast",
      emoji: "🛕",
      landmarkHint: "temple city markets",
      productEmojis: ["🥻", "🪔", "🍛", "📿", "🎨", "🥥"],
    },
  },
  {
    match: /kolkata|calcutta|bengal|howrah/i,
    brand: {
      primaryColor: "#ca8a04",
      secondaryColor: "#a16207",
      heroFrom: "#eab308",
      heroTo: "#422006",
      motif: "cultural",
      emoji: "🎭",
      landmarkHint: "city of joy markets",
      productEmojis: ["🍬", "📚", "🎨", "👗", "🫖", "🎁"],
    },
  },
  {
    match: /kerala|kochi|cochin|trivandrum|thiruvananthapuram|calicut|kozhikode/i,
    brand: {
      primaryColor: "#0f766e",
      secondaryColor: "#115e59",
      heroFrom: "#14b8a6",
      heroTo: "#042f2e",
      motif: "backwaters",
      emoji: "🌴",
      landmarkHint: "backwater bazaars",
      productEmojis: ["🥥", "🌿", "🐟", "🪔", "🎁", "🍯"],
    },
  },
  {
    match: /hyderabad|telangana|secunderabad/i,
    brand: {
      primaryColor: "#7c3aed",
      secondaryColor: "#5b21b6",
      heroFrom: "#8b5cf6",
      heroTo: "#1e1b4b",
      motif: "pearl-city",
      emoji: "💎",
      landmarkHint: "pearl city flavours",
      productEmojis: ["💎", "🍲", "📿", "🎁", "🧥", "✨"],
    },
  },
  {
    match: /ahmedabad|gujarat|surat|vadodara|rajkot/i,
    brand: {
      primaryColor: "#c026d3",
      secondaryColor: "#a21caf",
      heroFrom: "#d946ef",
      heroTo: "#4a044e",
      motif: "textile",
      emoji: "🧵",
      landmarkHint: "textile heritage streets",
      productEmojis: ["🧵", "🥻", "🥜", "🪔", "🎁", "📿"],
    },
  },
  {
    match: /lucknow|varanasi|banaras|up\b|uttar\s*pradesh|kanpur|agra/i,
    brand: {
      primaryColor: "#047857",
      secondaryColor: "#065f46",
      heroFrom: "#059669",
      heroTo: "#022c22",
      motif: "heritage",
      emoji: "🕌",
      landmarkHint: "heritage bazaars",
      productEmojis: ["🧵", "🍗", "📿", "🪔", "🎨", "🎁"],
    },
  },
  {
    match: /goa|panaji|margao/i,
    brand: {
      primaryColor: "#0891b2",
      secondaryColor: "#0e7490",
      heroFrom: "#06b6d4",
      heroTo: "#083344",
      motif: "beach",
      emoji: "🏖️",
      landmarkHint: "beachside stalls",
      productEmojis: ["🥥", "🐚", "🍹", "👕", "🎁", "🐟"],
    },
  },
  {
    match: /shimla|manali|himachal|dehradun|uttarakhand|himalaya/i,
    brand: {
      primaryColor: "#1d4ed8",
      secondaryColor: "#1e3a8a",
      heroFrom: "#3b82f6",
      heroTo: "#0f172a",
      motif: "mountain",
      emoji: "⛰️",
      landmarkHint: "hill-station lanes",
      productEmojis: ["🧣", "🍎", "🍵", "🪵", "🎁", "🧥"],
    },
  },
  {
    match: /amritsar|punjab|ludhiana|chandigarh/i,
    brand: {
      primaryColor: "#e11d48",
      secondaryColor: "#be123c",
      heroFrom: "#f43f5e",
      heroTo: "#4c0519",
      motif: "punjab",
      emoji: "🌾",
      landmarkHint: "golden city markets",
      productEmojis: ["🌾", "🧥", "🥙", "🎁", "📿", "✨"],
    },
  },
  {
    match: /indore|bhopal|mp\b|madhya/i,
    brand: {
      primaryColor: "#d97706",
      secondaryColor: "#b45309",
      heroFrom: "#f59e0b",
      heroTo: "#451a03",
      motif: "heartland",
      emoji: "🧡",
      landmarkHint: "heartland markets",
      productEmojis: ["🍲", "🧥", "🎁", "📿", "🪔", "🍪"],
    },
  },
];

export function getLocationBrand(city: string): LocationBrand {
  const text = city?.trim() || "";
  for (const row of LOCATION_BRANDS) {
    if (row.match.test(text)) return row.brand;
  }
  return DEFAULT_BRAND;
}

export function brandInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "LS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Map product category / name → emoji for visual cards */
export function productEmoji(name: string, category: string, location: LocationBrand, index: number): string {
  const text = `${name} ${category}`.toLowerCase();
  if (/pot|ceramic|clay|matti|kulhad/.test(text)) return "🏺";
  if (/cloth|textile|saree|sari|fabric|block.?print|kurta|dress|apparel/.test(text)) return "🧵";
  if (/diya|lamp|puja|pooja|temple|incense/.test(text)) return "🪔";
  if (/sweet|mithai|laddu|barfi|cake|bakery|cookie|biscuit/.test(text)) return "🍬";
  if (/tea|chai|coffee|brew/.test(text)) return "☕";
  if (/spice|masala|pickle|achar/.test(text)) return "🌶️";
  if (/jewellery|jewelry|necklace|earring|bangle|silver|gold/.test(text)) return "💎";
  if (/book|study|notebook|stationery|pen/.test(text)) return "📚";
  if (/gift|hamper|box|set/.test(text)) return "🎁";
  if (/snack|namkeen|chips|farsan/.test(text)) return "🥨";
  if (/fruit|veg|organic|farm/.test(text)) return "🥬";
  if (/beauty|soap|oil|cosmetic|skincare/.test(text)) return "🧴";
  if (/toy|game|kids|children/.test(text)) return "🧸";
  if (/flower|plant|garden|pot plant/.test(text)) return "🪴";
  return location.productEmojis[index % location.productEmojis.length] || "🛍️";
}

export function buildShopLogo(brandName: string, city: string): {
  initials: string;
  emoji: string;
  motif: string;
  bgFrom: string;
  bgTo: string;
  badge: string;
  primaryColor: string;
  secondaryColor: string;
  heroTheme: string;
  landmarkHint: string;
} {
  const loc = getLocationBrand(city);
  return {
    initials: brandInitials(brandName),
    emoji: loc.emoji,
    motif: loc.motif,
    bgFrom: loc.heroFrom,
    bgTo: loc.heroTo,
    badge: `${city || "Local"} · ${loc.landmarkHint}`,
    primaryColor: loc.primaryColor,
    secondaryColor: loc.secondaryColor,
    heroTheme: loc.motif,
    landmarkHint: loc.landmarkHint,
  };
}
