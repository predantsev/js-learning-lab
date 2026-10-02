// record: { label, amountMinor, date } — amountMinor in kopiykas, date as "YYYY-MM-DD".
// Returns display text for one locale: { label, amount, date }.
// The record itself must stay exactly as it was.
function formatForDisplay(record, locale) {
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "UAH" });
  // Local midnight of that day, shown in local time too: the same day on any computer.
  const [year, month, day] = record.date.split("-").map(Number);
  const localDay = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  return {
    label: record.label,
    amount: money.format(record.amountMinor / 100),
    date: localDay.format(new Date(year, month - 1, day)),
  };
}

const expense = { label: "%%lunch%%", amountMinor: 21050, date: "2026-03-02" };
console.log(formatForDisplay(expense, "uk-UA"));
console.log(formatForDisplay(expense, "en-US"));
console.log(expense);
