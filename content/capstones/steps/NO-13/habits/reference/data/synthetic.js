// Synthetic habits for measuring: habits built from the names of the starting habits, with
// completions over several years. The same arguments always give the same habits (no random
// numbers), so measurements can be repeated.
const NAMES = ["%%fixture1Name%%", "%%fixture2Name%%", "%%fixture3Name%%", "%%fixture4Name%%", "%%fixture5Name%%", "%%fixture6Name%%"];

// The calendar date `offset` days after 2023-01-01. Date.UTC counts in UTC, where every day has
// 24 hours, so there is no time zone in this arithmetic.
export function dayAfterStart(offset) {
  return new Date(Date.UTC(2023, 0, 1 + offset)).toISOString().slice(0, 10);
}

// `count` habits with the ids "s-1", "s-2", …; habit number i was completed on every (i % 3 + 1)-th
// day of `days` days from 2023-01-01, so its completions are sorted unique dates.
export function makeSyntheticHabits(count, days) {
  const list = [];
  for (let index = 0; index < count; index += 1) {
    const step = (index % 3) + 1;
    const completions = [];
    for (let offset = 0; offset < days; offset += step) {
      completions.push(dayAfterStart(offset));
    }
    list.push({ id: "s-" + (index + 1), name: NAMES[index % NAMES.length] + " " + index, frequency: "daily", active: index % 5 !== 0, completions: completions });
  }
  return list;
}
