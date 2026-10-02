import { test, expect } from "./testing.js";
import { binarySearchByDate } from "./dates.js";

const summaries = [
  { date: "2026-02-26", totalMinor: 0 },
  { date: "2026-02-27", totalMinor: 39990 },
  { date: "2026-02-28", totalMinor: 18000 },
  { date: "2026-03-01", totalMinor: 136550 },
  { date: "2026-03-02", totalMinor: 21050 },
];

test("%%tMiddle%%", () => {
  expect(binarySearchByDate(summaries, "2026-02-28")?.totalMinor, "%%mMiddle%%").toBe(18000);
});

test("%%tFirst%%", () => {
  expect(binarySearchByDate(summaries, "2026-02-26"), "%%mFirst%%").toBe(summaries[0]);
});

test("%%tLast%%", () => {
  expect(binarySearchByDate(summaries, "2026-03-02"), "%%mLast%%").toBe(summaries[4]);
});

test("%%tMissing%%", () => {
  expect(binarySearchByDate(summaries, "2026-02-29"), "%%mMissing%%").toBe(null);
});
