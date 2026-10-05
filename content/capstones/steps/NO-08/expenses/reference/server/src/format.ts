// Display text of the server scripts in the language from LOCALE. Amounts stay whole kopiykas (minor
// units) everywhere; only this module divides by 100, to show them.
import type { Locale } from "./config.ts";
import type { CategoryId } from "../../domain/expenses.ts";

const NUMBER_LOCALES: Record<Locale, string> = { uk: "uk-UA", en: "en-US" };

const CATEGORY_NAMES: Record<CategoryId, Record<Locale, string>> = {
  food: { uk: "Їжа", en: "Food" },
  transport: { uk: "Транспорт", en: "Transport" },
  home: { uk: "Дім", en: "Home" },
  fun: { uk: "Розваги", en: "Fun" },
};

// An amount in kopiykas as money text: "1 056,00 ₴" (uk) or "UAH 1,056.00" (en).
export function formatMoney(amountMinor: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALES[locale], { style: "currency", currency: "UAH" }).format(amountMinor / 100);
}

export function categoryName(category: CategoryId, locale: Locale): string {
  return CATEGORY_NAMES[category][locale];
}
