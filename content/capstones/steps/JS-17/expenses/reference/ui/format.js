// Display text for the page. The stored values stay canonical (amounts are whole kopiykas); only
// the page turns them into text, in the language of the project.

// An amount in kopiykas as money text in hryvnias, for example "845,50 ₴" (uk-UA) or "UAH 845.50"
// (en-US). The division by 100 happens only here, for the display; nothing is stored or summed
// after it.
export function formatMoney(amountMinor, locale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "UAH" }).format(amountMinor / 100);
}

// A calendar date "YYYY-MM-DD" as a long date, for example "1 березня 2026 р." (uk-UA). new Date of
// such text is midnight in UTC, so the formatter also uses UTC: every computer shows the same day.
export function formatDay(day, locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(day));
}
