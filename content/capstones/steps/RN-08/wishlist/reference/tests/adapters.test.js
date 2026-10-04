// Tests of the platform adapters (src/adapters.ts) and of the snapshot they save (src/snapshot.ts).
// No React Native here, so Node.js runs them with `npm test`.
import { test, expect } from "./testing.js";
import { createMemoryStorage, createPriceFormat } from "../src/adapters.ts";
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
  const records = [{ id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: null }];
  await saveSnapshot(storage, records);
  expect(KEY, "the key").toBe("jsll.wishlist.v1");
  expect(JSON.parse(await storage.getItem(KEY)), "the saved snapshot").toEqual({ schemaVersion: 1, records: records });
});

test("the price format gives the no-price label for null and money text with the digits for a price", () => {
  const format = createPriceFormat("%%formatLocale%%", "%%noPrice%%");
  expect(format.price(null), "no price").toBe("%%noPrice%%");
  expect(format.price(80).includes("80"), "80 → " + format.price(80)).toBe(true);
  expect(format.price(1250).includes("250"), "1250 → " + format.price(1250)).toBe(true);
  expect(format.price(0) === "%%noPrice%%", "a price of 0 is a price").toBe(false);
});
