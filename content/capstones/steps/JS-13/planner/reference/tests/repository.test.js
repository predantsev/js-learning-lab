// Tests of the planner repository in storage/repository.js. The same tests run for both designs,
// the class and the factory, so both must behave the same. A small stand-in object plays the
// storage: it has getItem and setItem like localStorage, but keeps the text in a plain object.
import { test, expect } from "./testing.js";
import { PlannerRepository, createPlannerRepository } from "../storage/repository.js";
import { loadTasks } from "../storage/tasks.js";

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
function sampleTasks() {
  return [
    { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-02", done: false, priority: "normal" },
    { id: "t-02", title: "%%fixture2Name%%", dueDate: "2026-03-01", done: true, priority: "high" },
    { id: "t-03", title: "%%fixture3Name%%", dueDate: null, done: false, priority: "low" },
  ];
}

const designs = [
  ["class", (storage, tasks) => new PlannerRepository(storage, tasks)],
  ["factory", (storage, tasks) => createPlannerRepository(storage, tasks)],
];

for (const [design, create] of designs) {
  test(design + ": items gives a copy of the list", () => {
    const repository = create(memoryStorage(), sampleTasks());
    repository.items.push({ id: "t-99" });
    expect(repository.items.map((task) => task.id), "ids after a push into the returned array").toEqual(["t-01", "t-02", "t-03"]);
  });

  test(design + ": add keeps a valid task and refuses an invalid one", () => {
    const repository = create(memoryStorage(), sampleTasks());
    repository.add("t-04", { title: "%%newName%%", dueDate: null });
    repository.add("t-05", { title: "", dueDate: null });
    expect(repository.items.map((task) => task.id), "ids after a valid and an invalid draft").toEqual(["t-01", "t-02", "t-03", "t-04"]);
  });

  test(design + ": toggleDone switches there and back and saves every change", () => {
    const storage = memoryStorage();
    const repository = create(storage, sampleTasks());
    repository.toggleDone("t-01");
    expect(repository.items[0].done, "after one toggle").toBe(true);
    expect(loadTasks(storage), "saved after one toggle").toEqual({ ok: true, tasks: repository.items });
    repository.toggleDone("t-01");
    expect(repository.items[0].done, "after two toggles").toBe(false);
    expect(loadTasks(storage), "saved after two toggles").toEqual({ ok: true, tasks: repository.items });
  });

  test(design + ": update and remove change one task and save", () => {
    const storage = memoryStorage();
    const repository = create(storage, sampleTasks());
    repository.update("t-03", { dueDate: "2026-03-05" });
    repository.remove("t-02");
    expect(repository.items.map((task) => [task.id, task.dueDate]), "ids and due dates").toEqual([["t-01", "2026-03-02"], ["t-03", "2026-03-05"]]);
    expect(loadTasks(storage), "saved list").toEqual({ ok: true, tasks: repository.items });
  });

  test(design + ": countDueBy counts pending tasks due on or before the day", () => {
    const repository = create(memoryStorage(), sampleTasks());
    // t-01 is due on the day; t-02 is due earlier but done; t-03 has no due date.
    expect(repository.countDueBy("2026-03-02"), "due by 2026-03-02").toBe(1);
    expect(repository.countDueBy("2026-03-01"), "due by 2026-03-01").toBe(0);
    expect(create(memoryStorage(), []).countDueBy("2026-03-02"), "due in []").toBe(0);
  });
}
