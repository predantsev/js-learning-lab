// Synthetic expenses for measuring: many records built from the labels of the starting expenses,
// over many dates. The same count always gives the same list (no random numbers), so measurements
// can be repeated.
const LABELS = ["%%fixture1Name%%", "%%fixture2Name%%", "%%fixture3Name%%", "%%fixture4Name%%", "%%fixture5Name%%", "%%fixture6Name%%"];
const CATEGORIES = ["food", "transport", "home", "fun"];

// The calendar date `offset` days after 2025-01-01. Date.UTC counts in UTC, where every day has
// 24 hours, so there is no time zone in this arithmetic.
export function dayAfterStart(offset) {
  return new Date(Date.UTC(2025, 0, 1 + offset)).toISOString().slice(0, 10);
}

// `count` expenses with the ids "s-1", "s-2", … on 365 dates from 2025-01-01, each with a whole
// amount above zero in kopiykas.
export function makeSyntheticExpenses(count) {
  const list = [];
  for (let index = 0; index < count; index += 1) {
    list.push({
      id: "s-" + (index + 1),
      label: LABELS[index % LABELS.length] + " " + (index % 1000),
      amountMinor: ((index * 137) % 100000) + 1,
      date: dayAfterStart(index % 365),
      category: CATEGORIES[index % CATEGORIES.length],
    });
  }
  return list;
}
