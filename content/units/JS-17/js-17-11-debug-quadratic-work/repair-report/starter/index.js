// Measures the report at three sizes, then runs your tests.
import { buildHabitReport, completionRate, mergeCompletions } from "./report.js";
import { categoriesById, makeDays, makeHabit } from "./data.js";

// Counts how often an array's items are read: a Proxy sees every index access.
function counted(list) {
  const counter = { reads: 0 };
  const proxy = new Proxy(list, {
    get(target, key, receiver) {
      if (typeof key === "string" && /^\d+$/.test(key)) counter.reads = counter.reads + 1;
      return Reflect.get(target, key, receiver);
    },
  });
  return { proxy, counter };
}

for (const size of [100, 400, 1600]) {
  const days = makeDays(size);
  const habit = makeHabit(1, days, "c-sport");
  const { proxy, counter } = counted(habit.completions);
  const start = performance.now();
  completionRate(proxy, days);
  console.log(`%%daysLabel%% ${size}: %%readsLabel%% ${counter.reads}, ${(performance.now() - start).toFixed(1)} ms`);

  // The bigger the dataset, the more imported habits it holds.
  const habits = [habit, makeHabit(2, days, "c-reading")];
  if (size >= 1600) habits.push(makeHabit(3, days, "c-imported"));
  for (const one of habits) {
    try {
      buildHabitReport(one, categoriesById, days, "2026-03-01");
    } catch (error) {
      console.log(`${one.id}: ${error.name}: ${error.message}`);
    }
  }
}

// Completions from this device plus an imported file with an older day in it.
const merged = mergeCompletions(["2026-02-27", "2026-02-28", "2026-03-01"], ["2026-02-28", "2026-02-20"]);
console.log("%%mergedLabel%%", merged.join(", "));

await import("./run-tests.js");
