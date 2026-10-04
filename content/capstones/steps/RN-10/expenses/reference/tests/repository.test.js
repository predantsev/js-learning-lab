// Tests of src/repository.ts with the memory storage: the starting expenses until something is saved,
// every accepted action saved, a refused one not, and the saved list read back by a new repository
// (what the list screen does on every focus).
import { test, expect } from "./testing.js";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";
import { KEY } from "../src/snapshot.ts";

function starting() {
  return [
    { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
    { id: "e-03", label: "%%fixture3Name%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
  ];
}

test("readAll gives the starting expenses while nothing is saved", async () => {
  const storage = createMemoryStorage();
  const repository = createRepository(storage, starting());
  expect((await repository.readAll()).records.length, "expenses").toBe(2);
  expect(await storage.getItem(KEY), "nothing saved by a read").toBe(null);
});

test("an accepted action is saved and a new repository reads it back", async () => {
  const storage = createMemoryStorage();
  await createRepository(storage, starting()).apply({ type: "removed", id: "e-03" });
  const again = (await createRepository(storage, starting()).readAll()).records;
  expect(again.length, "after a new read").toBe(1);
});

test("a refused action changes and saves nothing", async () => {
  const storage = createMemoryStorage();
  const repository = createRepository(storage, starting());
  const list = await repository.apply({ type: "updated", id: "e-01", fields: { label: "  ", amountMinor: 84550, date: "2026-03-01", category: "food" } });
  expect(list[0].label, "the label").toBe("%%fixture1Name%%");
  expect(await storage.getItem(KEY), "nothing saved").toBe(null);
});
