// Tests of the platform adapters (src/adapters.ts) and of the snapshot they save (src/snapshot.ts).
// No React Native here, so Node.js runs them with `npm test`.
import { test, expect } from "./testing.js";
import { createMemoryStorage, createMoneyFormat } from "../src/adapters.ts";
import { KEY, saveSnapshot } from "../src/snapshot.ts";

test("the memory storage gives back what was set and forgets what was removed", async () => {
  const storage = createMemoryStorage();
  expect(await storage.getItem("k"), "nothing saved yet").toBe(null);
  await storage.setItem("k", "text");
  expect(await storage.getItem("k"), "after setItem").toBe("text");
  await storage.removeItem("k");
  expect(await storage.getItem("k"), "after removeItem").toBe(null);
});

test("saveSnapshot writes { schemaVersion: 1, records } under the key of the React project", async () => {
  const storage = createMemoryStorage();
  const records = [{ id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" }];
  await saveSnapshot(storage, records);
  expect(KEY, "the key").toBe("jsll.expenses.v1");
  expect(JSON.parse(await storage.getItem(KEY)), "the saved snapshot").toEqual({ schemaVersion: 1, records: records });
});

test("the money format shows whole kopiykas as hryvnias with two digits after the separator", () => {
  const format = createMoneyFormat("%%formatLocale%%");
  expect(format.money(84550).includes("845%%decimalMark%%50"), "84550 → " + format.money(84550)).toBe(true);
  expect(format.money(9990).includes("99%%decimalMark%%90"), "9990 → " + format.money(9990)).toBe(true);
  expect(format.money(5).includes("0%%decimalMark%%05"), "5 → " + format.money(5)).toBe(true);
});
