// The workload: ROUNDS times, first INSERTS new day summaries arrive, then LOOKUPS searches by date.
const RECORDS = 100000;
const ROUNDS = 3;
const INSERTS = 10;
const LOOKUPS = 100;

// Synthetic day summaries, one per date, imported in shuffled order.
const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_DAY = Date.UTC(1900, 0, 1);
const dateAt = (i) => new Date(FIRST_DAY + i * DAY_MS).toISOString().slice(0, 10);

let seed = 7;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
function makeSummaries(count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({ date: dateAt(i), totalMinor: 1000 + (i % 500) });
  }
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
const lookupDates = () => Array.from({ length: LOOKUPS }, () => dateAt(Math.floor(random() * RECORDS)));

let ops = 0;

// 1. Linear scan: nothing to prepare, every lookup walks the list.
function runScan() {
  const list = makeSummaries(RECORDS);
  ops = 0;
  for (let round = 0; round < ROUNDS; round++) {
    for (let k = 0; k < INSERTS; k++) list.push({ date: dateAt(RECORDS + round * INSERTS + k), totalMinor: 0 });
    for (const date of lookupDates()) {
      list.find((summary) => {
        ops = ops + 1;
        return summary.date === date;
      });
    }
  }
  return ops;
}

// 2. A Map index: built once, updated on every insert, one step per lookup.
function runIndex() {
  const list = makeSummaries(RECORDS);
  ops = 0;
  const byDate = new Map();
  for (const summary of list) {
    ops = ops + 1;
    byDate.set(summary.date, summary);
  }
  for (let round = 0; round < ROUNDS; round++) {
    for (let k = 0; k < INSERTS; k++) {
      const summary = { date: dateAt(RECORDS + round * INSERTS + k), totalMinor: 0 };
      list.push(summary);
      ops = ops + 1;
      byDate.set(summary.date, summary);
    }
    for (const date of lookupDates()) {
      ops = ops + 1;
      byDate.get(date);
    }
  }
  return ops;
}

// 3. Sort a copy, then binary search. Inserts break the order, so the copy is sorted again
//    before the next lookups. A binary search over n items needs at most ⌈log₂(n + 1)⌉ comparisons.
function runSorted() {
  const list = makeSummaries(RECORDS);
  ops = 0;
  for (let round = 0; round < ROUNDS; round++) {
    for (let k = 0; k < INSERTS; k++) list.push({ date: dateAt(RECORDS + round * INSERTS + k), totalMinor: 0 });
    list.toSorted((a, b) => {
      ops = ops + 1;
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });
    ops = ops + LOOKUPS * Math.ceil(Math.log2(list.length + 1));
  }
  return ops;
}

console.log(`${RECORDS} %%records%%, ${ROUNDS} %%rounds%% × (${INSERTS} %%inserts%% + ${LOOKUPS} %%lookups%%)`);
console.log("%%scan%%", runScan());
console.log("%%index%%", runIndex());
console.log("%%sorted%%", runSorted());
