// record: { label, amountMinor, date } — amountMinor in kopiykas, date as "YYYY-MM-DD".
// Returns display text for one locale: { label, amount, date }.
// The record itself must stay exactly as it was.
function formatForDisplay(record, locale) {
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "UAH" });
  const day = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
  return {
    label: record.label,
    amount: money.format(record.amountMinor / 100),
    // Local midnight ("T00:00" has no zone), but shown in UTC.
    date: day.format(new Date(record.date + "T00:00")),
  };
}

const expense = { label: "%%lunch%%", amountMinor: 21050, date: "2026-03-02" };
console.log(formatForDisplay(expense, "uk-UA"));
console.log(formatForDisplay(expense, "en-US"));
console.log(expense);
