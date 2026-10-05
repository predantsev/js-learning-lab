// Display text of the server scripts in the language from LOCALE. The values stay canonical (whole
// hryvnias); only this module turns them into text.
import type { Locale } from "./config.ts";

const NUMBER_LOCALES: Record<Locale, string> = { uk: "uk-UA", en: "en-US" };

// A price in whole hryvnias as money text: "365 ₴" (uk) or "UAH 365" (en).
export function formatPrice(price: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALES[locale], { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(price);
}
