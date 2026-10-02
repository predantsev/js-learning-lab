// n synthetic wishes with different ids: the worst case for a duplicate check.
function makeWishes(n) {
  const wishes = [];
  for (let i = 0; i < n; i++) {
    wishes.push({ id: "w-" + i, name: "%%wish%% " + i });
  }
  return wishes;
}

let operations = 0;

function hasDuplicateNested(list) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      operations = operations + 1;
      if (list[i].id === list[j].id) {
        return true;
      }
    }
  }
  return false;
}

function hasDuplicateWithSet(list) {
  const seen = new Set();
  for (const wish of list) {
    operations = operations + 1;
    if (seen.has(wish.id)) {
      return true;
    }
    seen.add(wish.id);
  }
  return false;
}

// The third of five sorted times: one slow run does not move it.
function middleOfFive(times) {
  const sorted = times.toSorted((a, b) => a - b);
  return sorted[2];
}

// Runs check(list) `repeats` times; returns the operations of one run and every run's time.
function timeIt(check, list, repeats) {
  const times = [];
  let ops = 0;
  for (let r = 0; r < repeats; r++) {
    operations = 0;
    const start = performance.now();
    check(list);
    times.push(performance.now() - start);
    ops = operations;
  }
  return { ops, times };
}

const REPEATS = 5;
for (const n of [250, 500, 1000, 2000, 4000]) {
  const wishes = makeWishes(n);
  const nested = timeIt(hasDuplicateNested, wishes, REPEATS);
  const withSet = timeIt(hasDuplicateWithSet, wishes, REPEATS);
  console.log(
    `n=${n} · %%nested%% ${nested.ops} %%ops%%, ${middleOfFive(nested.times).toFixed(1)} ms` +
      ` · Set: ${withSet.ops} %%ops%%, ${middleOfFive(withSet.times).toFixed(1)} ms`,
  );
}

// Five runs of the same size, one by one: is the first run different?
const runs = timeIt(hasDuplicateNested, makeWishes(2000), REPEATS).times;
console.log("%%fiveRuns%%", runs.map((ms) => ms.toFixed(1)).join(" · "));
