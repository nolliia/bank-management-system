import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.2,
  CAD: 1.37,
  AUD: 1.52,
  CHF: 0.89,
  CNY: 7.23,
};

/**
 * Convert amount from one currency to another
 * @param amount Amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
  
  const convertedAmount = amountInUSD * EXCHANGE_RATES[toCurrency];
  
  return Math.round(convertedAmount * 100) / 100;
}
