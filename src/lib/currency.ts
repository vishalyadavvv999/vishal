import type { CurrencyCode } from '../types';

const LOCALE_MAP: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
};

export function formatPrice(amount: number, currency: CurrencyCode = 'INR'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(LOCALE_MAP[currency] || 'en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'INR' ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `${currency} ${safeAmount.toFixed(2)}`;
  }
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
