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

// Malformed text quietly turns into "no records": the caller cannot tell it from an empty list.
function fromStoredText(text) {
  try {
    return { ok: true, records: JSON.parse(text) };
  } catch (error) {
    return { ok: true, records: [] };
  }
}

const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: new Date("2026-03-01"), category: "food" },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
];

const text = toStoredText(expenses);
console.log(text);
console.log(fromStoredText(text));
console.log(fromStoredText('[{"id":"e-01"'));
