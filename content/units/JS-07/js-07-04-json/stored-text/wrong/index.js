function toDay(date) {
  return date.toISOString().slice(0, 10);
}

function toStoredText(records) {
  const plain = records.map((record) => ({
    ...record,
    date: record.date instanceof Date ? toDay(record.date) : record.date,
  }));
  return JSON.stringify(plain);
}

// No try/catch: malformed text crashes the caller with a SyntaxError.
function fromStoredText(text) {
  return { ok: true, records: JSON.parse(text) };
}

const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: new Date("2026-03-01"), category: "food" },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
];

const text = toStoredText(expenses);
console.log(text);
console.log(fromStoredText(text));
