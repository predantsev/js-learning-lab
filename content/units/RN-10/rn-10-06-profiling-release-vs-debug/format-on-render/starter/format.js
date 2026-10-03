// format.js: formatter factories that count how many formatters were built. Do not edit.
export const formatterStats = { created: 0 };

export function createMoneyFormat(locale) {
  formatterStats.created += 1;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'UAH' });
}

export function createDayFormat(locale) {
  formatterStats.created += 1;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' });
}
