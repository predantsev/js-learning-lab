// Display text for the page. The stored values stay canonical (amounts are whole kopiykas); only
// the page turns them into text, in the language of the project.

// An amount in kopiykas as money text in hryvnias, for example "845,50 грн" (uk-UA in Chrome; Node.js prints "845,50 ₴") or "UAH 845.50"
// (en-US). The division by 100 happens only here, for the display; nothing is stored or summed
// after it.
export function formatMoney(amountMinor, locale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "UAH" }).format(amountMinor / 100);
}
