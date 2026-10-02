// Expense records as they arrive from a form or an import:
// { id, label, amountText, date } — amountText is typed text such as "845,50".
const records = [
  { id: "e-01", label: "%%groceries%%", amountText: "845,50", date: "2026-03-01" },
  { id: "e-02", label: "%%pass%%", amountText: "520", date: "2026-03-01" },
  { id: "e-02", label: "%%pass%%", amountText: "520", date: "2026-03-01" },
  { id: "e-03", label: "%%coffee%%", amountText: "0,10", date: "2026-02-28" },
];

// Returns { byId, count, totalMinor, display, search } — see the task.
function summarize(records, locale) {
  const seen = new Set();
  const unique = records.filter((record) => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
  const byId = new Map(unique.map((record) => [record.id, record]));

  const minorOf = (text) => {
    const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(text.trim());
    return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  };
  let totalMinor = 0;
  for (const record of unique) {
    totalMinor += minorOf(record.amountText);
  }

  const display = [];
  for (const record of unique) {
    const points = Array.from(record.label);
    display.push({
      id: record.id,
      label: points.length > 20 ? points.slice(0, 20).join("") + "…" : record.label,
      amount: (minorOf(record.amountText) / 100).toLocaleString(locale, { style: "currency", currency: "UAH" }),
      date: new Date(record.date + "T00:00:00Z").toLocaleDateString(locale, { dateStyle: "medium", timeZone: "UTC" }),
    });
  }

  const key = (text) => text.trim().toLowerCase().normalize("NFD");
  const search = (query) => unique.filter((record) => key(record.label).includes(key(query))).map((record) => record.id);

  return { byId, count: unique.length, totalMinor, display, search };
}

const summary = summarize(records, "%%locale%%");
console.log(summary);
