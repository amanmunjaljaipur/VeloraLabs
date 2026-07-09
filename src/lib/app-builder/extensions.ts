import type {
  AppExtensionId,
  AppIdeaExample,
  InterviewQuestion,
} from "@/lib/app-builder/types";

export interface AppExtensionMeta {
  id: AppExtensionId;
  label: string;
  /** Plain language for non-technical users */
  plainLabel: string;
  description: string;
  /** Deployed app path prefix */
  pathPrefix: string;
  questions: InterviewQuestion[];
}

/** Starter ideas — big cards, zero jargon */
export const APP_IDEA_EXAMPLES: AppIdeaExample[] = [
  {
    id: "crafts",
    title: "Handmade crafts shop",
    description: "Pottery, textiles, gifts from your city",
    emoji: "🏺",
    prompt:
      "I want a simple online shop for my local handmade crafts so neighbours and visitors can see products and message me to buy.",
  },
  {
    id: "kirana",
    title: "Neighbourhood grocery",
    description: "Daily needs, snacks, home delivery notes",
    emoji: "🛒",
    prompt:
      "I run a small neighbourhood grocery and want a simple online catalogue so people nearby can see prices and order on WhatsApp.",
  },
  {
    id: "bakery",
    title: "Home bakery / snacks",
    description: "Cakes, cookies, festival sweets",
    emoji: "🧁",
    prompt:
      "I bake from home and want a pretty shop page for cakes and snacks with my phone number and order options.",
  },
  {
    id: "tuition",
    title: "Study materials stall",
    description: "Books, notes, stationery for students",
    emoji: "📚",
    prompt:
      "I sell school and college study materials and want a simple website parents and students can open on their phone.",
  },
  {
    id: "fashion",
    title: "Clothes & accessories",
    description: "Kurtas, jewellery, local fashion",
    emoji: "👗",
    prompt:
      "I sell clothes and accessories from my local shop and want an online lookbook with prices and contact.",
  },
  {
    id: "custom",
    title: "Something else",
    description: "Describe your idea in your own words",
    emoji: "✨",
    prompt: "",
  },
];

export const APP_EXTENSIONS: AppExtensionMeta[] = [
  {
    id: "ecom-local-shop",
    label: "Local shop",
    plainLabel: "A simple shop website people can open on their phone",
    description:
      "Home, product list, about, FAQ, and contact — with your logo colours matching your city. Perfect if you are not technical.",
    pathPrefix: "/apps",
    questions: [
      {
        id: "brandName",
        label: "What should we call your shop?",
        helpText: "This name appears at the top of your website. Keep it short and easy to remember.",
        placeholder: "e.g. Meera’s Craft Corner",
        required: true,
        selectMode: "free",
        suggestions: [
          "My Family Store",
          "Neighbourhood Picks",
          "City Craft Basket",
          "Home Kitchen Treats",
          "Student Study Hub",
        ],
      },
      {
        id: "city",
        label: "Where is your shop based?",
        helpText:
          "We use your city to pick logo colours and a local feel (like pink-stone for Jaipur, greens for Bengaluru).",
        placeholder: "e.g. Jaipur, Rajasthan",
        required: true,
        selectMode: "single",
        suggestions: [
          "Jaipur, Rajasthan",
          "Mumbai, Maharashtra",
          "Delhi NCR",
          "Bengaluru, Karnataka",
          "Chennai, Tamil Nadu",
          "Hyderabad, Telangana",
          "Kolkata, West Bengal",
          "Ahmedabad, Gujarat",
          "Pune, Maharashtra",
          "Kochi, Kerala",
          "Lucknow, Uttar Pradesh",
          "Indore, Madhya Pradesh",
        ],
        allowCustom: true,
      },
      {
        id: "shopType",
        label: "What kind of shop is this?",
        helpText: "Tap all that fit. You can also type your own.",
        required: true,
        selectMode: "multi",
        suggestions: [
          "Handmade crafts",
          "Grocery / kirana",
          "Home bakery & snacks",
          "Clothes & fashion",
          "Jewellery & accessories",
          "Books & study materials",
          "Gifts & hampers",
          "Organic / farm products",
          "Beauty & self-care",
          "Kids & toys",
          "Home décor",
          "Festival specials",
        ],
        allowCustom: true,
        hint: "Shop categories guide product layout and icons",
      },
      {
        id: "whatYouSell",
        label: "What do you sell? Name a few real products",
        helpText:
          "List 3–8 things people can buy. Rough prices help (e.g. “Blue pottery vase – ₹450”). No perfect spelling needed.",
        placeholder: "e.g. Block-print cushion cover ₹399 · Clay diya set ₹199 · Gift hamper ₹899",
        required: true,
        multiline: true,
        selectMode: "free",
        suggestions: [
          "Signature product around ₹499",
          "Everyday item under ₹300",
          "Gift pack for festivals",
          "Student combo pack",
          "Family size / bulk option",
        ],
        allowCustom: true,
        hint: "Concrete product names with prices for the catalogue",
      },
      {
        id: "audience",
        label: "Who usually buys from you?",
        helpText: "Think of real people — neighbours, students, tourists, parents…",
        required: true,
        selectMode: "multi",
        suggestions: [
          "Neighbours & local families",
          "School & college students",
          "Parents of school kids",
          "Tourists & visitors",
          "Office-goers nearby",
          "Wedding & festival gift buyers",
          "Online customers in my city",
          "Friends of regular customers",
        ],
        allowCustom: true,
      },
      {
        id: "vibe",
        label: "How should your shop feel?",
        helpText: "This sets the words and style on your pages. Pick what sounds like you.",
        required: true,
        selectMode: "multi",
        suggestions: [
          "Warm & homely",
          "Simple & clear",
          "Festive & colourful",
          "Premium & careful",
          "Student-friendly & affordable",
          "Trustworthy family business",
          "Modern but local",
          "Mix of Hindi & English is fine",
        ],
        allowCustom: true,
        hint: "Brand tone for copy",
      },
      {
        id: "howToOrder",
        label: "How should people order from you?",
        helpText: "Most local shops start with WhatsApp or a phone call — that is perfectly fine.",
        required: true,
        selectMode: "multi",
        suggestions: [
          "WhatsApp message",
          "Phone call",
          "Visit the shop (pickup)",
          "Home delivery in my area",
          "Cash on delivery",
          "UPI payment",
          "Pay at shop",
        ],
        allowCustom: true,
      },
      {
        id: "hours",
        label: "When are you open? (optional)",
        helpText: "Helps customers know when to message or visit.",
        required: false,
        selectMode: "single",
        suggestions: [
          "Mon–Sat 10am–8pm",
          "Everyday 9am–9pm",
          "Evenings & weekends only",
          "Orders anytime on WhatsApp",
          "By appointment",
        ],
        allowCustom: true,
      },
      {
        id: "contact",
        label: "How can customers reach you?",
        helpText: "Add phone and/or WhatsApp (same number is ok), email if you have one, and area/address.",
        placeholder: "e.g. +91 98xxx · WhatsApp same · near City Market, Jaipur",
        required: true,
        multiline: true,
        selectMode: "free",
        suggestions: [
          "WhatsApp only for now",
          "Phone + shop visit",
          "I will add full address later",
        ],
        allowCustom: true,
      },
      {
        id: "mustHave",
        label: "Anything you definitely want on the website?",
        helpText: "Tap ideas below or write your own. These become special points on your shop.",
        required: false,
        selectMode: "multi",
        suggestions: [
          "Show that we are a local family shop",
          "Festival offers section",
          "Student discount mention",
          "Safe packaging for gifts",
          "No online payment needed — pay later",
          "Photos will come later — use nice icons for now",
          "Simple words, no English jargon",
          "Trust: quality promise",
        ],
        allowCustom: true,
      },
    ],
  },
];

export function getExtension(id: string): AppExtensionMeta | undefined {
  return APP_EXTENSIONS.find((e) => e.id === id);
}

export function slugifyAppName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
