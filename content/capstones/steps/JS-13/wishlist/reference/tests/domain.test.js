// Tests of the wishlist rules in domain/wishes.js. Only pure functions are tested here: no page and
// no storage, so the same file also runs under Node.js.
import { test, expect } from "./testing.js";
import { validateItem, summarizeItems, filterItems, sortItemsByPrice, searchKey, searchItems, indexById, categoriesInUse, paginate } from "../domain/wishes.js";

// A fresh list for every test, so a test that changes it cannot change another test's data.
function sampleWishes() {
  return [
    { id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: null },
    { id: "w-02", name: "%%fixture2Name%%", price: null, acquired: false, category: null },
    { id: "w-03", name: "%%fixture3Name%%", price: 0, acquired: false, category: null },
    { id: "w-04", name: "%%fixture4Name%%", price: 25, acquired: true, category: null },
  ];
}

test("validateItem accepts a name of 80 characters", () => {
  expect(validateItem({ name: "a".repeat(80), price: 10 }).ok, "80 characters").toBe(true);
});

test("validateItem rejects a name of 81 characters", () => {
  expect(validateItem({ name: "a".repeat(81), price: 10 }), "81 characters").toEqual({ ok: false, errors: { name: "too-long" } });
});

test("validateItem rejects an empty name and a negative price", () => {
  expect(validateItem({ name: "  ", price: -1 }), "empty name, price -1").toEqual({ ok: false, errors: { name: "required", price: "negative" } });
});

test("validateItem keeps a price of 0 and no price", () => {
  expect(validateItem({ name: "%%fixture1Name%%", price: 0 }), "price 0").toEqual({ ok: true, value: { name: "%%fixture1Name%%", price: 0 } });
  expect(validateItem({ name: "%%fixture1Name%%", price: null }), "price null").toEqual({ ok: true, value: { name: "%%fixture1Name%%", price: null } });
});

test("summarizeItems counts a wish without a price separately and leaves out acquired ones", () => {
  // Wanted: 80, no price, 0. The acquired wish (25) is not in the total.
  expect(summarizeItems(sampleWishes()), "summary of the sample").toEqual({ count: 4, wantedTotal: 80, wantedWithoutPrice: 1 });
});

test("summarizeItems of an empty list is all zeros", () => {
  expect(summarizeItems([]), "summary of []").toEqual({ count: 0, wantedTotal: 0, wantedWithoutPrice: 0 });
});

test("filterItems keeps only the wanted or only the acquired wishes", () => {
  expect(filterItems(sampleWishes(), "wanted").map((item) => item.id), "wanted").toEqual(["w-01", "w-02", "w-03"]);
  expect(filterItems(sampleWishes(), "acquired").map((item) => item.id), "acquired").toEqual(["w-04"]);
});

test("sortItemsByPrice puts cheaper wishes first and wishes without a price last", () => {
  const list = sampleWishes();
  expect(sortItemsByPrice(list).map((item) => item.id), "sorted ids").toEqual(["w-03", "w-04", "w-01", "w-02"]);
  expect(list.map((item) => item.id), "the list passed in").toEqual(["w-01", "w-02", "w-03", "w-04"]);
});

test("validateItem rejects a price that is not a whole number", () => {
  expect(validateItem({ name: "%%fixture1Name%%", price: 12.5 }), "price 12.5").toEqual({ ok: false, errors: { price: "not-whole" } });
  expect(validateItem({ name: "%%fixture1Name%%", price: 12 }).ok, "price 12").toBe(true);
});

test("searchKey gives the same key however the text was typed", () => {
  // The same word typed as one character per letter and with a letter + a combining mark.
  expect(searchKey("  %%unicodeWord%% "), "composed").toBe("%%unicodeKey%%");
  expect(searchKey("%%unicodeWordDecomposed%%"), "decomposed").toBe("%%unicodeKey%%");
});

test("searchItems finds a wish by name or category, whatever the case and the Unicode form", () => {
  const list = [...sampleWishes(), { id: "w-05", name: "%%unicodeWord%%", price: 30, acquired: false, category: "%%unicodeCategory%%" }];
  expect(searchItems(list, " %%unicodeQuery%% ").map((item) => item.id), "decomposed query").toEqual(["w-05"]);
  expect(searchItems(list, "%%unicodeCategoryQuery%%").map((item) => item.id), "category").toEqual(["w-05"]);
  expect(searchItems(list, "").length, "empty query").toBe(5);
});

test("indexById and categoriesInUse build a Map and a Set", () => {
  const list = [
    { id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: "%%techCategory%%" },
    { id: "w-02", name: "%%fixture2Name%%", price: 45, acquired: false, category: "%%homeCategory%%" },
    { id: "w-03", name: "%%fixture3Name%%", price: 240, acquired: false, category: "%%techCategory%%" },
    { id: "w-04", name: "%%fixture4Name%%", price: 25, acquired: true, category: null },
  ];
  expect(indexById(list).get("w-03").name, "the wish w-03 in the index").toBe("%%fixture3Name%%");
  expect([...categoriesInUse(list)], "categories in use").toEqual(["%%techCategory%%", "%%homeCategory%%"]);
});

test("paginate yields pages of at most size, the last one shorter", () => {
  expect([...paginate([1, 2, 3, 4, 5], 2)], "5 items, size 2").toEqual([[1, 2], [3, 4], [5]]);
  expect([...paginate([1, 2, 3, 4], 2)], "4 items, size 2").toEqual([[1, 2], [3, 4]]);
  expect([...paginate([], 2)], "no items").toEqual([]);
});

test("paginate builds the next page only when it is asked for", () => {
  const items = [1, 2, 3];
  const pages = paginate(items, 2);
  pages.next();
  items.push(4);
  expect(pages.next().value, "the second page, built after 4 was added").toEqual([3, 4]);
});
