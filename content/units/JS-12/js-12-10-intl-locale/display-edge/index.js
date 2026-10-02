// Stored data: canonical values only — whole kopiykas and a calendar date.
const expense = { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: "2026-03-01" };
const before = JSON.stringify(expense);

const locale = "uk-UA";

// Display: text is made only here, at the edge, for one locale.
const money = new Intl.NumberFormat(locale, { style: "currency", currency: "UAH" });
const day = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
console.log(expense.label, "—", money.format(expense.amountMinor / 100), "—", day.format(new Date(expense.date)));

// Sorting names: the default sort compares code units, a Collator follows the language.
const names = ["їжак", "яблуко", "груша", "ґанок", "єнот"];
console.log("sort():", [...names].sort().join(", "));
console.log("Collator:", [...names].sort(new Intl.Collator(locale).compare).join(", "));

console.log("%%unchanged%%", JSON.stringify(expense) === before);
