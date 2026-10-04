// Tests of the CP-RN enhancement's rule (src/summary.ts) under the course runner: the totals of every
// group come from summarizeItems, and a change saved through the repository is in the next read.
import { test, expect } from "./testing.js";
import { categoryGroups } from "../src/summary.ts";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";

const wishes = [
  { id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: "%%techCategory%%" },
  { id: "w-03", name: "%%fixture3Name%%", price: 240, acquired: false, category: "%%techCategory%%" },
  { id: "w-05", name: "%%fixture5Name%%", price: null, acquired: false, category: "%%techCategory%%" },
  { id: "w-04", name: "%%fixture4Name%%", price: 25, acquired: true, category: "%%techCategory%%" },
];

test("a group's wanted total leaves out acquired wishes and counts wishes without a price apart", () => {
  expect(categoryGroups(wishes, "%%formatLocale%%"), "one category").toEqual([{ category: "%%techCategory%%", items: wishes, count: 4, wantedTotal: 320, wantedWithoutPrice: 1 }]);
  expect(categoryGroups([], "%%formatLocale%%"), "no wishes").toEqual([]);
});

test("the groups follow a change saved through the repository, as after a restart", async () => {
  const storage = createMemoryStorage();
  await createRepository(storage, wishes).apply({ type: "acquiredToggled", id: "w-03" });
  const after = (await createRepository(storage, []).readAll()).records;
  expect(categoryGroups(after, "%%formatLocale%%")[0].wantedTotal, "w-03 acquired").toBe(80);
});
