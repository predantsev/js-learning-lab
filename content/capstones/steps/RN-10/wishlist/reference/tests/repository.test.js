// Tests of src/repository.ts with the memory storage: the starting wishes until something is saved,
// every accepted action saved, a refused one not, and the saved list read back by a new repository
// (what the list screen does on every focus).
import { test, expect } from "./testing.js";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";
import { KEY } from "../src/snapshot.ts";

function startingWishes() {
  return [
    { id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: null },
    { id: "w-03", name: "%%fixture3Name%%", price: 240, acquired: false, category: null },
  ];
}

test("readAll gives the starting wishes while nothing is saved", async () => {
  const storage = createMemoryStorage();
  const repository = createRepository(storage, startingWishes());
  expect((await repository.readAll()).records.length, "wishes").toBe(2);
  expect(await storage.getItem(KEY), "nothing saved by a read").toBe(null);
});

test("an accepted action is saved and a new repository reads it back", async () => {
  const storage = createMemoryStorage();
  await createRepository(storage, startingWishes()).apply({ type: "acquiredToggled", id: "w-03" });
  const again = (await createRepository(storage, startingWishes()).readAll()).records;
  expect(again[1].acquired, "w-03 after a new read").toBe(true);
});

test("a refused action changes and saves nothing", async () => {
  const storage = createMemoryStorage();
  const repository = createRepository(storage, startingWishes());
  const list = await repository.apply({ type: "updated", id: "w-01", fields: { name: "  ", price: 80, acquired: false, category: null } });
  expect(list[0].name, "the name").toBe("%%fixture1Name%%");
  expect(await storage.getItem(KEY), "nothing saved").toBe(null);
});
