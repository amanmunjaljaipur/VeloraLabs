/** Introductory offer — 70% off list price */
export const INTRO_DISCOUNT_PERCENT = 70;
export const INTRO_OFFER_LABEL = "Introductory offer";

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

export function getIntroPricing(price: string, discountPercent = INTRO_DISCOUNT_PERCENT): IntroPricing {
  const originalAmount = parseInrPrice(price);
  const currentAmount = Math.round(originalAmount * (1 - discountPercent / 100));
  const savingsAmount = originalAmount - currentAmount;

  return {
    original: formatInrPrice(originalAmount),
    originalAmount,
    current: formatInrPrice(currentAmount),
    currentAmount,
    savings: formatInrPrice(savingsAmount),
    discountPercent,
  };
}