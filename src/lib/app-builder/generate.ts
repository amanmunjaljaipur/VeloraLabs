import { buildShopLogo, getLocationBrand, productEmoji } from "@/lib/app-builder/branding";
import { detectVerticalFromPrompt } from "@/lib/app-builder/detect-vertical";
import { getExtension } from "@/lib/app-builder/extensions";
import { generateGenericAppContent } from "@/lib/app-builder/generate-generic";
import {
  aboutImageUrl,
  applyLogoImage,
  enrichProductImages,
  heroImageUrl,
  resolveLogoChoice,
} from "@/lib/app-builder/images";
import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import type {
  AppExtensionContent,
  AppExtensionId,
  AppInterviewAnswer,
  AppLlmSecrets,
  EcomLocalShopContent,
  EcomProduct,
  ShopLogo,
} from "@/lib/app-builder/types";

function answerMap(answers: AppInterviewAnswer[]): Record<string, string> {
  return Object.fromEntries(answers.map((a) => [a.id, a.answer.trim()]));
}

function splitList(value?: string): string[] {
  return value
    ? value
        .split(/[,;\n|]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

function extractPhone(contact: string): string {
  return contact.match(/\+?[\d][\d\s-]{8,}/)?.[0]?.trim() || "";
}

function extractEmail(contact: string): string {
  return contact.match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] || "";
}

function enrichProducts(products: EcomProduct[], city: string, brandName: string): EcomProduct[] {
  const loc = getLocationBrand(city);
  const withEmoji = products.map((p, i) => ({
    ...p,
    id: p.id || `p${i + 1}`,
    emoji: p.emoji || productEmoji(p.name, p.category, loc, i),
  }));
  return enrichProductImages(withEmoji, { brandName, city });
}

function makeLogo(brandName: string, city: string): ShopLogo {
  const b = buildShopLogo(brandName, city);
  return {
    initials: b.initials,
    emoji: b.emoji,
    motif: b.motif,
    bgFrom: b.bgFrom,
    bgTo: b.bgTo,
    badge: b.badge,
  };
}

function withVisuals(
  content: EcomLocalShopContent,
  answers: AppInterviewAnswer[],
  prompt: string
): EcomLocalShopContent {
  const a = answerMap(answers);
  const choice = resolveLogoChoice(a);
  const logo = applyLogoImage(
    content.logo || makeLogo(content.brandName, content.city),
    choice,
    content.brandName,
    content.city
  );
  const sell =
    a.whatYouSell || a.servicesDetail || content.description || prompt.slice(0, 100);
  const vibe = a.vibe || a.tone || content.tagline;

  const products = enrichProducts(content.products, content.city, content.brandName);
  const gallery = products
    .slice(0, 4)
    .map((p) => p.image)
    .filter((u): u is string => Boolean(u));

  return {
    ...content,
    logo,
    products,
    heroImageUrl:
      content.heroImageUrl ||
      heroImageUrl({
        brandName: content.brandName,
        city: content.city,
        whatYouSell: sell,
        vibe,
      }),
    aboutImageUrl:
      content.aboutImageUrl ||
      aboutImageUrl({ brandName: content.brandName, city: content.city }),
    galleryImageUrls: content.galleryImageUrls?.length ? content.galleryImageUrls : gallery,
  };
}

function fallbackEcom(
  answers: AppInterviewAnswer[],
  customPoints: string[] = [],
  prompt = ""
): EcomLocalShopContent {
  const a = answerMap(answers);
  const brand = a.brandName || "Local Shop";
  const city = a.city || "Your city";
  const locBrand = buildShopLogo(brand, city);
  const orderMethods = [
    ...splitList(a.howToOrder || a.howToReach || a.bookingChannel),
    ...splitList(a.shippingHow),
  ].filter((v, i, arr) => arr.indexOf(v) === i);
  const shopTypes = splitList(a.shopType || a.serviceType);
  const vibe = splitList(a.vibe || a.tone);
  const mustHave = splitList(a.mustHave);
  const unique = splitList(a.uniqueSelling);
  const payments = splitList(a.paymentToday);
  const channels = splitList(a.sellChannel);
  const ownerHighlights = [
    ...unique,
    ...mustHave,
    ...customPoints.map((p) => p.trim()).filter(Boolean),
  ]
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .slice(0, 12);

  const sellLines = (a.whatYouSell || a.servicesDetail || "")
    .split(/[\n·•]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const products: EcomProduct[] = (
    sellLines.length > 0 ? sellLines : ["Signature product", "Everyday pick", "Gift set"]
  )
    .slice(0, 8)
    .map((line, i) => {
      const priceMatch = line.match(/₹\s*[\d,]+|Rs\.?\s*[\d,]+|INR\s*[\d,]+/i);
      const name =
        line.replace(/[-–—:]?\s*(₹|Rs\.?|INR).*$/i, "").trim() || `Product ${i + 1}`;
      return {
        id: `p${i + 1}`,
        name: name.slice(0, 80),
        description: line,
        price:
          priceMatch?.[0]?.replace(/\s+/g, "") ||
          (i === 0 ? "₹499" : i === 1 ? "₹299" : "₹799"),
        category: shopTypes[0] || "Bestsellers",
        featured: i < 2,
      };
    });

  const phone = extractPhone(a.contact || "");
  const email = extractEmail(a.contact || "") || "hello@example.com";

  const base: EcomLocalShopContent = {
    extensionId: "ecom-local-shop",
    brandName: brand,
    tagline:
      unique[0] ||
      (channels.some((c) => /whatsapp/i.test(c))
        ? `Order on WhatsApp · Local in ${city}`
        : `Local picks from ${city}`),
    description:
      a.whatYouSell ||
      `${brand} is a friendly local shop in ${city}${
        shopTypes.length ? ` for ${shopTypes.join(", ")}` : ""
      }.${unique.length ? ` Known for: ${unique.slice(0, 3).join(", ")}.` : ""}`,
    primaryColor: locBrand.primaryColor,
    secondaryColor: locBrand.secondaryColor,
    accentColor: locBrand.bgFrom,
    surfaceColor: locBrand.primaryColor,
    themePalette: [
      locBrand.primaryColor,
      locBrand.secondaryColor,
      locBrand.bgFrom,
      locBrand.bgTo,
    ],
    seoTitle: `${brand} · ${city} | Local shop`,
    seoDescription: `${brand} in ${city}. ${
      a.whatYouSell?.slice(0, 80) || "Local products"
    }. Order via WhatsApp or visit us.`.slice(0, 160),
    city,
    currency: "INR",
    contactEmail: email,
    contactPhone: phone,
    whatsappNumber: phone,
    address: a.contact || city,
    heroHeadline: `Welcome to ${brand}`,
    heroSubheadline: a.audience
      ? `Made for ${splitList(a.audience).slice(0, 2).join(" & ") || a.audience}. ${
          vibe[0] || "Warm and trustworthy."
        }`
      : `Quality from ${locBrand.landmarkHint}.`,
    aboutHtml: `<p>${brand} is a local shop serving ${city}. ${
      a.whatYouSell || ""
    }</p><p>${
      ownerHighlights.join(" · ") || "We focus on quality, fair prices, and friendly service."
    }</p>`,
    products: enrichProducts(products, city, brand),
    categories: [...new Set(products.map((p) => p.category))],
    faqs: [
      {
        question: "How do I place an order?",
        answer: orderMethods.length
          ? `You can order via: ${orderMethods.join(
              ", "
            )}. We will confirm everything with you personally.`
          : "Message us on WhatsApp or call — we will help you step by step.",
      },
      {
        question: "Do you deliver?",
        answer: orderMethods.some((m) => /deliver/i.test(m))
          ? "Yes — we deliver in our local area. Ask us for details."
          : "Pickup at the shop is available. Message us if you need delivery nearby.",
      },
      {
        question: "How do I pay?",
        answer: orderMethods.some((m) => /upi|cash|pay/i.test(m))
          ? `Payment options include: ${
              orderMethods.filter((m) => /upi|cash|pay|cod/i.test(m)).join(", ") || "UPI or cash"
            }.`
          : "UPI and cash are usually fine — we will confirm when you order.",
      },
    ],
    ctaLabel: "See products",
    footerNote: `© ${new Date().getFullYear()} ${brand} · ${city}`,
    logo: makeLogo(brand, city),
    heroTheme: locBrand.heroTheme,
    openingHours: a.hours || "",
    orderMethods: orderMethods.length ? orderMethods : ["WhatsApp message", "Phone call"],
    paymentMethods: payments.length
      ? payments
      : orderMethods.filter((m) => /upi|cash|card|pay/i.test(m)).length
        ? orderMethods.filter((m) => /upi|cash|card|pay/i.test(m))
        : ["UPI", "Cash"],
    deliveryNote:
      splitList(a.shippingHow)[0] ||
      orderMethods.find((m) => /deliver|pickup/i.test(m)) ||
      "Ask us about pickup or delivery",
    trustBadges: [
      "Local shop",
      unique[0] || (vibe.includes("Trustworthy family business") ? "Family-run" : "Friendly service"),
      payments.some((p) => /upi/i.test(p)) ? "UPI accepted" : "Simple ordering",
      channels.some((c) => /whatsapp/i.test(c)) ? "WhatsApp friendly" : "",
    ].filter(Boolean),
    ownerHighlights,
    languageNote: vibe.some((v) => /hindi/i.test(v))
      ? "We are happy to chat in simple Hindi or English."
      : undefined,
  };

  return withVisuals(base, answers, prompt);
}

type LlmShopShape = Omit<
  EcomLocalShopContent,
  "extensionId" | "logo" | "heroTheme" | "secondaryColor" | "heroImageUrl" | "aboutImageUrl"
> & {
  secondaryColor?: string;
  logoEmoji?: string;
};

/**
 * Generate extension content from prompt + answers.
 * Ecom shops → catalogue runtime. Everything else → generic multi-page app.
 */
export async function generateExtensionContent(input: {
  extensionId: string;
  prompt: string;
  answers: AppInterviewAnswer[];
  customPoints?: string[];
  secrets: AppLlmSecrets;
}): Promise<{ content: AppExtensionContent; generatedBy: string }> {
  const detected = detectVerticalFromPrompt(input.prompt);
  let extensionId = (input.extensionId || detected.extensionId) as AppExtensionId;
  // Prefer prompt detection when user left default ecom but idea is not a shop
  if (
    extensionId === "ecom-local-shop" &&
    detected.extensionId !== "ecom-local-shop" &&
    detected.confidence !== "low"
  ) {
    extensionId = detected.extensionId;
  }

  if (extensionId !== "ecom-local-shop") {
    return generateGenericAppContent({
      ...input,
      extensionId,
    });
  }

  const customPoints = (input.customPoints || []).map((p) => p.trim()).filter(Boolean);
  const qa = input.answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");
  const customBlock =
    customPoints.length > 0
      ? `\n\nOwner's own points (must include on the site):\n- ${customPoints.join("\n- ")}`
      : "";

  try {
    const raw = await callUserLlm({
      secrets: input.secrets,
      maxTokens: 5000,
      temperature: 0.45,
      messages: [
        {
          role: "system",
          content: `You build complete content for a LOCAL SHOP website for people who are NOT technical (like school students' parents, small shop owners).
Use simple, warm language. Avoid jargon.
Interview answers were designed by a product manager from the owner's idea — treat every Q&A as source of truth.
Pay special attention to industry-leader style answers:
- offline day, customer steps, sell channels (WhatsApp/shop/Instagram)
- unique selling points → trust badges and about section
- shippingHow → deliveryNote and FAQ
- paymentToday → paymentMethods and FAQ
- appHelpHope / successGoal → hero CTA and subheadline
- shareWhere → soft hints for launch
Shape like a clean Shopify/Dukaan mini-store: clear catalogue, trust, WhatsApp order, local delivery — not a bloated SaaS.
Return ONLY valid JSON:
{
  "brandName": string,
  "tagline": string,
  "description": string,
  "primaryColor": string (hex — pick colours that feel local to the city),
  "secondaryColor": string (hex),
  "city": string,
  "currency": string,
  "contactEmail": string,
  "contactPhone": string,
  "whatsappNumber": string,
  "address": string,
  "heroHeadline": string,
  "heroSubheadline": string,
  "aboutHtml": string (simple HTML paragraphs),
  "products": Array<{ "id": string, "name": string, "description": string, "price": string, "category": string, "emoji"?: string, "featured"?: boolean }>,
  "categories": string[],
  "faqs": Array<{ "question": string, "answer": string }>,
  "ctaLabel": string,
  "footerNote": string,
  "openingHours": string,
  "orderMethods": string[],
  "paymentMethods": string[],
  "deliveryNote": string,
  "trustBadges": string[],
  "ownerHighlights": string[],
  "languageNote": string
}
Rules:
- 5-10 products with realistic INR prices if India
- Concrete product names so we can generate matching photos later
- FAQs in simple words (how to order, pay, deliver)
- Reflect every interview answer and owner points
- No fake claims
- Do NOT invent image URLs — the system adds photos and logo after`,
        },
        {
          role: "user",
          content: `Original idea:\n${input.prompt}\n\nInterview answers:\n${qa}${customBlock}\n\nBuild the complete local shop content pack.`,
        },
      ],
    });

    const parsed = parseJsonObject<LlmShopShape>(raw);
    if (!parsed.brandName || !parsed.products?.length) {
      throw new Error("Incomplete shop content from LLM");
    }

    const city = parsed.city || answerMap(input.answers).city || "Local";
    const brandName = parsed.brandName;
    const logo = makeLogo(brandName, city);
    const loc = buildShopLogo(brandName, city);

    const content: EcomLocalShopContent = withVisuals(
      {
        extensionId: "ecom-local-shop",
        brandName,
        tagline: parsed.tagline || "Local shop",
        description: parsed.description || "",
        primaryColor: parsed.primaryColor || loc.primaryColor,
        secondaryColor: parsed.secondaryColor || loc.secondaryColor,
        accentColor: loc.bgFrom,
        surfaceColor: parsed.primaryColor || loc.primaryColor,
        themePalette: [
          parsed.primaryColor || loc.primaryColor,
          parsed.secondaryColor || loc.secondaryColor,
          loc.bgFrom,
          loc.bgTo,
        ],
        seoTitle: `${brandName} · ${city} | Local shop`,
        seoDescription: (parsed.description || parsed.tagline || `${brandName} in ${city}`).slice(
          0,
          160
        ),
        city,
        currency: parsed.currency || "INR",
        contactEmail: parsed.contactEmail || "hello@example.com",
        contactPhone: parsed.contactPhone || "",
        whatsappNumber: parsed.whatsappNumber || parsed.contactPhone || "",
        address: parsed.address || "",
        heroHeadline: parsed.heroHeadline || brandName,
        heroSubheadline: parsed.heroSubheadline || parsed.tagline || "",
        aboutHtml: parsed.aboutHtml || `<p>${parsed.description}</p>`,
        products: enrichProducts(
          parsed.products.map((p, i) => ({
            id: p.id || `p${i + 1}`,
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category || "General",
            emoji: p.emoji,
            featured: p.featured,
          })),
          city,
          brandName
        ),
        categories:
          parsed.categories?.length > 0
            ? parsed.categories
            : [...new Set(parsed.products.map((p) => p.category || "General"))],
        faqs: parsed.faqs?.length
          ? parsed.faqs
          : [
              {
                question: "How do I order?",
                answer: "Message us on WhatsApp — we will help you.",
              },
            ],
        ctaLabel: parsed.ctaLabel || "See products",
        footerNote: parsed.footerNote || `© ${brandName}`,
        logo,
        heroTheme: loc.heroTheme,
        openingHours: parsed.openingHours || "",
        orderMethods: parsed.orderMethods?.length ? parsed.orderMethods : ["WhatsApp message"],
        paymentMethods: parsed.paymentMethods?.length
          ? parsed.paymentMethods
          : ["UPI", "Cash"],
        deliveryNote: parsed.deliveryNote || "",
        trustBadges: parsed.trustBadges?.length
          ? parsed.trustBadges
          : ["Local shop", "Friendly service"],
        ownerHighlights: [...(parsed.ownerHighlights || []), ...customPoints].filter(
          (v, i, arr) => v && arr.indexOf(v) === i
        ),
        languageNote: parsed.languageNote,
      },
      input.answers,
      input.prompt
    );

    return {
      content,
      generatedBy: `${input.secrets.provider}:${input.secrets.model || "default"}`,
    };
  } catch (error) {
    console.error("[app-builder] LLM generate failed, using template:", error);
    return {
      content: fallbackEcom(input.answers, customPoints, input.prompt),
      generatedBy: "template-fallback",
    };
  }
}
