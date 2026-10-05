// Characterization tests of the indexed version: it must give exactly what the slow version gave,
// on synthetic data and on small cases written by hand.
import { test, expect } from "./testing.js";
import { duplicateNames, searchKey } from "../domain/wishes.ts";
import { makeSyntheticWishes } from "../data/synthetic.js";

// The slow version, kept as the reference of the behaviour: for every wish it looks through the
// whole list again (some), so the work grows with the square of the length.
function slowDuplicateNames(list) {
  const repeated = new Set();
  for (const item of list) {
    const key = searchKey(item.name);
    if (list.some((other) => other !== item && searchKey(other.name) === key)) {
      repeated.add(key);
    }
  }
  return repeated;
}

test("duplicateNames gives the same names as the slow version on 600 synthetic wishes", () => {
  const list = makeSyntheticWishes(600);
  expect([...duplicateNames(list)].sort(), "duplicate names").toEqual([...slowDuplicateNames(list)].sort());
});

test("duplicateNames compares names by their search key", () => {
  const list = [
    { id: "a", name: "%%unicodeWord%%", price: 1, acquired: false, category: null },
    { id: "b", name: " %%unicodeQuery%% ", price: 2, acquired: false, category: null },
    { id: "c", name: "%%fixture1Name%%", price: 3, acquired: false, category: null },
  ];
  expect([...duplicateNames(list)], "the repeated names").toEqual(["%%unicodeKey%%"]);
});
