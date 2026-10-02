// record: { label, amountMinor, date } — amountMinor in kopiykas, date as "YYYY-MM-DD".
// Returns display text for one locale: { label, amount, date }.
// The record itself must stay exactly as it was.
function formatForDisplay(record, locale) {
  const hryvnias = record.amountMinor / 100;
  return {
    label: record.label,
    amount: hryvnias.toLocaleString(locale, { style: "currency", currency: "UAH" }),
    date: new Date(record.date).toLocaleDateString(locale, { dateStyle: "long", timeZone: "UTC" }),
  };
}

const expense = { label: "%%lunch%%", amountMinor: 21050, date: "2026-03-02" };
console.log(formatForDisplay(expense, "uk-UA"));
console.log(formatForDisplay(expense, "en-US"));
console.log(expense);
