function toDay(date) {
  return date.toISOString().slice(0, 10);
}

// The dates are converted inside the caller's own records: their Date objects are gone afterwards.
function toStoredText(records) {
  for (const record of records) {
    if (record.date instanceof Date) {
      record.date = toDay(record.date);
    }
  }
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
