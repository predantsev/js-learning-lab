// Tests of src/repository.ts with the memory storage: the starting habits until something is saved,
// every accepted action saved, a refused one not, and the saved list read back by a new repository
// (what the list screen does on every focus).
import { test, expect } from "./testing.js";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";
import { KEY } from "../src/snapshot.ts";

function starting() {
  return [
    { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: [] },
    { id: "h-03", name: "%%fixture3Name%%", frequency: "daily", active: true, completions: [] },
  ];
}

test("readAll gives the starting habits while nothing is saved", async () => {
  const storage = createMemoryStorage();
  const repository = createRepository(storage, starting());
  expect((await repository.readAll()).records.length, "habits").toBe(2);
  expect(await storage.getItem(KEY), "nothing saved by a read").toBe(null);
});

test("an accepted action is saved and a new repository reads it back", async () => {
  const storage = createMemoryStorage();
  await createRepository(storage, starting()).apply({ type: "activeToggled", id: "h-03" });
  const again = (await createRepository(storage, starting()).readAll()).records;
  expect(again[1].active, "h-03 after a new read").toBe(false);
});

test("a refused action changes and saves nothing", async () => {
  const storage = createMemoryStorage();
  const repository = createRepository(storage, starting());
  const list = await repository.apply({ type: "updated", id: "h-01", fields: { name: "  ", frequency: "daily", active: true } });
  expect(list[0].name, "the name").toBe("%%fixture1Name%%");
  expect(await storage.getItem(KEY), "nothing saved").toBe(null);
});
