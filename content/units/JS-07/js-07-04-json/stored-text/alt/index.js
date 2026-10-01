function toDay(date) {
  return date.toISOString().slice(0, 10);
}

// A loop instead of map, and the parsed value kept in a variable before returning.
function toStoredText(records) {
  const plain = [];
  for (const record of records) {
    const copy = { ...record };
    if (copy.date instanceof Date) {
      copy.date = toDay(copy.date);
    }
    plain.push(copy);
  }
  return JSON.stringify(plain);
}

function fromStoredText(text) {
  let records;
  try {
    records = JSON.parse(text);
  } catch (error) {
    return { ok: false, reason: error.name + ": " + error.message };
  }
  return { ok: true, records: records };
}

const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: new Date("2026-03-01"), category: "food" },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
];

const text = toStoredText(expenses);
console.log(text);
console.log(fromStoredText(text));
console.log(fromStoredText('[{"id":"e-01"'));
