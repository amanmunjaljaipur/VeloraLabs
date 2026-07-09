import { getExtension } from "@/lib/app-builder/extensions";
import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import type {
  AppInterviewAnswer,
  AppLlmSecrets,
  EcomLocalShopContent,
  EcomProduct,
} from "@/lib/app-builder/types";

function answerMap(answers: AppInterviewAnswer[]): Record<string, string> {
  return Object.fromEntries(answers.map((a) => [a.id, a.answer.trim()]));
}

function fallbackEcom(answers: AppInterviewAnswer[]): EcomLocalShopContent {
  const a = answerMap(answers);
  const brand = a.brandName || "Local Shop";
  const city = a.city || "Your city";
  const products: EcomProduct[] = [
    {
      id: "p1",
      name: "Signature product",
      description: a.whatYouSell?.slice(0, 160) || "Handpicked local favourite.",
      price: "₹499",
      category: "Bestsellers",
      featured: true,
    },
    {
      id: "p2",
      name: "Everyday essential",
      description: "Reliable quality for daily use.",
      price: "₹299",
      category: "Essentials",
    },
    {
      id: "p3",
      name: "Gift set",
      description: "Perfect for friends and family.",
      price: "₹899",
      category: "Gifts",
      featured: true,
    },
  ];

  return {
    extensionId: "ecom-local-shop",
    brandName: brand,
    tagline: `Local picks from ${city}`,
    description: a.whatYouSell || `${brand} serves ${city} with carefully chosen products.`,
    primaryColor: "#0d9488",
    city,
    currency: a.currency || "INR",
    contactEmail: a.contact?.match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] || "hello@example.com",
    contactPhone: a.contact?.match(/\+?[\d\s-]{8,}/)?.[0]?.trim() || "",
    address: a.contact || city,
    heroHeadline: `Shop local at ${brand}`,
    heroSubheadline: a.audience
      ? `Made for ${a.audience}. ${a.tone || "Warm and trustworthy."}`
      : "Quality products from your neighbourhood.",
    aboutHtml: `<p>${brand} is a local shop serving ${city}. ${a.whatYouSell || ""}</p><p>${a.extra || "We focus on quality, fair prices, and friendly service."}</p>`,
    products,
    categories: [...new Set(products.map((p) => p.category))],
    faqs: [
      {
        question: "Do you deliver?",
        answer: a.extra || "Contact us for delivery or pickup options in your area.",
      },
      {
        question: "How do I place an order?",
        answer: "Browse products on the shop page and reach us via phone, email, or WhatsApp to confirm.",
      },
    ],
    ctaLabel: "Browse shop",
    footerNote: `© ${new Date().getFullYear()} ${brand} · ${city}`,
  };
}

/**
 * Generate extension content with the user's LLM, falling back to a solid template.
 */
export async function generateExtensionContent(input: {
  extensionId: string;
  prompt: string;
  answers: AppInterviewAnswer[];
  secrets: AppLlmSecrets;
}): Promise<{ content: EcomLocalShopContent; generatedBy: string }> {
  const ext = getExtension(input.extensionId);
  if (!ext || ext.id !== "ecom-local-shop") {
    throw new Error("Unsupported extension");
  }

  const qa = input.answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");

  try {
    const raw = await callUserLlm({
      secrets: input.secrets,
      maxTokens: 4500,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `You are an expert product + copy system that builds a local e-commerce shop content pack.
Return ONLY valid JSON matching this TypeScript shape:
{
  "brandName": string,
  "tagline": string,
  "description": string,
  "primaryColor": string (hex like #0d9488),
  "city": string,
  "currency": string,
  "contactEmail": string,
  "contactPhone": string,
  "address": string,
  "heroHeadline": string,
  "heroSubheadline": string,
  "aboutHtml": string (simple HTML paragraphs),
  "products": Array<{ "id": string, "name": string, "description": string, "price": string, "category": string, "featured"?: boolean }>,
  "categories": string[],
  "faqs": Array<{ "question": string, "answer": string }>,
  "ctaLabel": string,
  "footerNote": string
}
Rules: 5-10 products, realistic INR prices if India, no fake claims, match brand tone from answers.`,
        },
        {
          role: "user",
          content: `Original prompt:\n${input.prompt}\n\nInterview answers:\n${qa}\n\nBuild the complete ecom-local-shop content pack.`,
        },
      ],
    });

    const parsed = parseJsonObject<Omit<EcomLocalShopContent, "extensionId">>(raw);
    if (!parsed.brandName || !parsed.products?.length) {
      throw new Error("Incomplete shop content from LLM");
    }

    const content: EcomLocalShopContent = {
      extensionId: "ecom-local-shop",
      brandName: parsed.brandName,
      tagline: parsed.tagline || "Local shop",
      description: parsed.description || "",
      primaryColor: parsed.primaryColor || "#0d9488",
      city: parsed.city || "Local",
      currency: parsed.currency || "INR",
      contactEmail: parsed.contactEmail || "hello@example.com",
      contactPhone: parsed.contactPhone || "",
      address: parsed.address || "",
      heroHeadline: parsed.heroHeadline || parsed.brandName,
      heroSubheadline: parsed.heroSubheadline || parsed.tagline || "",
      aboutHtml: parsed.aboutHtml || `<p>${parsed.description}</p>`,
      products: parsed.products.map((p, i) => ({
        id: p.id || `p${i + 1}`,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category || "General",
        featured: p.featured,
      })),
      categories:
        parsed.categories?.length > 0
          ? parsed.categories
          : [...new Set(parsed.products.map((p) => p.category || "General"))],
      faqs: parsed.faqs?.length
        ? parsed.faqs
        : [{ question: "How do I order?", answer: "Contact us to place an order." }],
      ctaLabel: parsed.ctaLabel || "Shop now",
      footerNote: parsed.footerNote || `© ${parsed.brandName}`,
    };

    return {
      content,
      generatedBy: `${input.secrets.provider}:${input.secrets.model || "default"}`,
    };
  } catch (error) {
    console.error("[app-builder] LLM generate failed, using template:", error);
    return {
      content: fallbackEcom(input.answers),
      generatedBy: "template-fallback",
    };
  }
}
