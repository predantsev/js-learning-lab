// Expense records as they arrive from a form or an import:
// { id, label, amountText, date } — amountText is typed text such as "845,50".
const records = [
  { id: "e-01", label: "%%groceries%%", amountText: "845,50", date: "2026-03-01" },
  { id: "e-02", label: "%%pass%%", amountText: "520", date: "2026-03-01" },
  { id: "e-02", label: "%%pass%%", amountText: "520", date: "2026-03-01" },
  { id: "e-03", label: "%%coffee%%", amountText: "0,10", date: "2026-02-28" },
];

const MAX_LABEL = 20;

function toMinor(amountText) {
  return Math.round(parseFloat(amountText) * 100);
}

function shortLabel(label) {
  const points = [...label];
  return points.length <= MAX_LABEL ? label : points.slice(0, MAX_LABEL).join("") + "…";
}

function searchKey(text) {
  return text.normalize("NFC").trim().toLowerCase();
}

// Returns { byId, count, totalMinor, display, search } — see the task.
function summarize(records, locale) {
  const byId = new Map();
  for (const record of records) {
    if (!byId.has(record.id)) {
      byId.set(record.id, record);
    }
  }
  const unique = [...byId.values()];

  const totalMinor = unique.reduce((sum, record) => sum + toMinor(record.amountText), 0);

  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "UAH" });
  const day = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const display = unique.map((record) => ({
    id: record.id,
    label: shortLabel(record.label),
    amount: money.format(toMinor(record.amountText) / 100),
    date: day.format(new Date(record.date)),
  }));

  function search(query) {
    const wanted = searchKey(query);
    return unique.filter((record) => searchKey(record.label).includes(wanted)).map((record) => record.id);
  }

  return { byId, count: unique.length, totalMinor, display, search };
}

const summary = summarize(records, "%%locale%%");
console.log(summary);
