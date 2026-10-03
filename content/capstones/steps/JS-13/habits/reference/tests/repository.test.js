// Tests of the habit repository in storage/repository.js. The same tests run for both designs,
// the class and the factory, so both must behave the same. A small stand-in object plays the
// storage: it has getItem and setItem like localStorage, but keeps the text in a plain object.
import { test, expect } from "./testing.js";
import { HabitRepository, createHabitRepository } from "../storage/repository.js";
import { loadHabits } from "../storage/habits.js";

function memoryStorage() {
  const data = {};
  return {
    getItem: (key) => (Object.hasOwn(data, key) ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
}

// A fresh list for every test.
function sampleHabits() {
  return [
    { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-20", "2026-02-28", "2026-03-01"] },
    { id: "h-02", name: "%%fixture2Name%%", frequency: "weekly", active: false, completions: [] },
  ];
}

const designs = [
  ["class", (storage, habits) => new HabitRepository(storage, habits)],
  ["factory", (storage, habits) => createHabitRepository(storage, habits)],
];

for (const [design, create] of designs) {
  test(design + ": items gives a copy of the list", () => {
    const repository = create(memoryStorage(), sampleHabits());
    repository.items.push({ id: "h-99" });
    expect(repository.items.map((habit) => habit.id), "ids after a push into the returned array").toEqual(["h-01", "h-02"]);
  });

  test(design + ": add keeps a valid habit and refuses an invalid one", () => {
    const repository = create(memoryStorage(), sampleHabits());
    repository.add("h-03", { name: "%%newName%%", frequency: "daily" });
    repository.add("h-04", { name: "", frequency: "daily" });
    expect(repository.items.map((habit) => habit.id), "ids after a valid and an invalid draft").toEqual(["h-01", "h-02", "h-03"]);
  });

  test(design + ": markCompleted adds the day once and saves", () => {
    const storage = memoryStorage();
    const repository = create(storage, sampleHabits());
    repository.markCompleted("h-02", "2026-03-02");
    repository.markCompleted("h-02", "2026-03-02");
    expect(repository.items[1].completions, "completions after marking the same day twice").toEqual(["2026-03-02"]);
    expect(loadHabits(storage), "saved after marking").toEqual({ ok: true, habits: repository.items });
  });

  test(design + ": update and remove change one habit and save", () => {
    const storage = memoryStorage();
    const repository = create(storage, sampleHabits());
    repository.update("h-02", { active: true });
    repository.remove("h-01");
    expect(repository.items.map((habit) => [habit.id, habit.active]), "ids and active flags").toEqual([["h-02", true]]);
    expect(loadHabits(storage), "saved list").toEqual({ ok: true, habits: repository.items });
  });

  test(design + ": completionRate counts only the given days", () => {
    const repository = create(memoryStorage(), sampleHabits());
    // h-01 was also completed on 2026-02-20, which is not one of the days.
    expect(repository.completionRate("h-01", ["2026-02-28", "2026-03-01", "2026-03-02", "2026-03-03"]), "rate of h-01").toBe(0.5);
    expect(repository.completionRate("h-02", ["2026-03-01"]), "rate of h-02").toBe(0);
    expect(repository.completionRate("h-01", []), "rate over no days").toBe(0);
  });
}
