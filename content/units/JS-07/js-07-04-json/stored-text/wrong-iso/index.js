function toDay(date) {
  return date.toISOString().slice(0, 10);
}

// Dates are left to JSON.stringify, which writes them as "2026-03-01T00:00:00.000Z".
function toStoredText(records) {
  return JSON.stringify(records);
}

function fromStoredText(text) {
  try {
    return { ok: true, records: JSON.parse(text) };
  } catch (error) {
    return { ok: false, reason: error.message };
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
