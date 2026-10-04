// Tests of src/repository.ts with the memory storage: the starting tasks until something is saved,
// every accepted action saved, a refused one not, and the saved list read back by a new repository
// (what the list screen does on every focus).
import { test, expect } from "./testing.js";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";
import { KEY } from "../src/snapshot.ts";

function starting() {
  return [
    { id: "t-02", title: "%%fixture2Name%%", dueDate: "2026-03-01", done: false, priority: "high" },
    { id: "t-03", title: "%%fixture3Name%%", dueDate: null, done: false, priority: "low" },
  ];
}

test("readAll gives the starting tasks while nothing is saved", async () => {
  const storage = createMemoryStorage();
  const repository = createRepository(storage, starting());
  expect((await repository.readAll()).records.length, "tasks").toBe(2);
  expect(await storage.getItem(KEY), "nothing saved by a read").toBe(null);
});

test("an accepted action is saved and a new repository reads it back", async () => {
  const storage = createMemoryStorage();
  await createRepository(storage, starting()).apply({ type: "doneToggled", id: "t-03" });
  const again = (await createRepository(storage, starting()).readAll()).records;
  expect(again[1].done, "t-03 after a new read").toBe(true);
});

test("a refused action changes and saves nothing", async () => {
  const storage = createMemoryStorage();
  const repository = createRepository(storage, starting());
  const list = await repository.apply({ type: "updated", id: "t-02", fields: { title: "  ", dueDate: null, done: false, priority: "high" } });
  expect(list[0].title, "the title").toBe("%%fixture2Name%%");
  expect(await storage.getItem(KEY), "nothing saved").toBe(null);
});
