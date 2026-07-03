/** Introductory offer — discounted list prices */
export const INTRO_OFFER_LABEL = "Introductory offer";

/** List price (INR) → fixed introductory sale price */
export const INTRO_PRICE_BY_LIST: Record<number, number> = {
  9999: 2999,
  14999: 3999,
  24999: 6999,
};

export interface IntroPricing {
  original: string;
  originalAmount: number;
  current: string;
  currentAmount: number;
  savings: string;
  discountPercent: number;
}

export function parseInrPrice(price: string): number {
  const digits = price.replace(/[^\d]/g, "");
  return Number.parseInt(digits, 10) || 0;
}

export function formatInrPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function getIntroPricing(price: string): IntroPricing {
  const originalAmount = parseInrPrice(price);
  const currentAmount =
    INTRO_PRICE_BY_LIST[originalAmount] ??
    Math.round(originalAmount * 0.7);
  const savingsAmount = originalAmount - currentAmount;
  const discountPercent = Math.round((savingsAmount / originalAmount) * 100);

  return {
    original: formatInrPrice(originalAmount),
    originalAmount,
    current: formatInrPrice(currentAmount),
    currentAmount,
    savings: formatInrPrice(savingsAmount),
    discountPercent,
  };
}

export function buildIntroOfferSummary(): string {
  const tracks = [
    { label: "School Students", list: 9999 },
    { label: "College Engineers", list: 14999 },
    { label: "Product Managers", list: 24999 },
  ];
  const parts = tracks.map(({ label, list }) => {
    const p = getIntroPricing(formatInrPrice(list));
    return `${label}: ${p.current} (was ${p.original})`;
  });
  return `All full programs currently have an introductory discount off list price. ${parts.join(". ")}. The free 2-hour session remains completely free.`;
}