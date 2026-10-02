// toDay(date) gives the calendar day of a date made from "YYYY-MM-DD" text:
// toDay(new Date("2026-03-01")) → "2026-03-01". (It reads the UTC date, so no time zone shifts it.)
function toDay(date) {
  return date.toISOString().slice(0, 10);
}

// toStoredText(records): JSON text of the records, with every date as "YYYY-MM-DD" text.
// A record's date may be a Date object or already "YYYY-MM-DD" text. The records themselves stay unchanged.
function toStoredText(records) {
  // Write here.
}

// fromStoredText(text): { ok: true, records } for readable JSON text,
// { ok: false, reason } with the error's message when JSON.parse throws.
function fromStoredText(text) {
  // Write here.
}

const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: new Date("2026-03-01"), category: "food" },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
];

const text = toStoredText(expenses);
console.log(text);
console.log(fromStoredText(text));
console.log(fromStoredText('[{"id":"e-01"'));
