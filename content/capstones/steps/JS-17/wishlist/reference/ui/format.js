// Display text for the page. The stored values stay canonical (a whole number of hryvnias or null);
// only the page turns them into text, in the language of the project.

// A price in whole hryvnias as money text, for example "1 250 ₴" (uk-UA) or "UAH 1,250" (en-US).
export function formatPrice(price, locale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(price);
}
