// Tests of the expense rules in domain/expenses.js. Only pure functions are tested here: no page
// and no storage, so the same file also runs under Node.js.
import { test, expect } from "./testing.js";
import { validateExpense, summarizeExpenses, filterExpenses, sortExpenses, parseAmountMinor, searchKey, searchExpenses, totalsByCategory, paginate } from "../domain/expenses.js";

// A fresh list for every test, so a test that changes it cannot change another test's data.
// Amounts are whole kopiykas (amountMinor).
function sampleExpenses() {
  return [
    { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
    { id: "e-02", label: "%%fixture2Name%%", amountMinor: 52000, date: "2026-02-27", category: "transport" },
    { id: "e-03", label: "%%fixture3Name%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
    { id: "e-04", label: "%%fixture4Name%%", amountMinor: 9990, date: "2026-03-02", category: "home" },
    { id: "e-06", label: "%%fixture6Name%%", amountMinor: 21050, date: "2026-02-26", category: "food" },
  ];
}

test("validateExpense accepts a label of 80 characters", () => {
  expect(validateExpense({ label: "a".repeat(80), amountMinor: 100, date: "2026-03-01", category: "food" }).ok, "80 characters").toBe(true);
});

test("validateExpense rejects a label of 81 characters", () => {
  expect(validateExpense({ label: "a".repeat(81), amountMinor: 100, date: "2026-03-01", category: "food" }), "81 characters").toEqual({ ok: false, errors: { label: "too-long" } });
});

test("validateExpense rejects an amount of 0 and of 99.5, and accepts 1", () => {
  const draft = (amountMinor) => ({ label: "%%fixture1Name%%", amountMinor: amountMinor, date: "2026-03-01", category: "food" });
  expect(validateExpense(draft(0)), "amountMinor 0").toEqual({ ok: false, errors: { amountMinor: "not-positive-integer" } });
  expect(validateExpense(draft(99.5)), "amountMinor 99.5").toEqual({ ok: false, errors: { amountMinor: "not-positive-integer" } });
  expect(validateExpense(draft(1)).ok, "amountMinor 1").toBe(true);
});

test("summarizeExpenses adds up every category and the total", () => {
  // food = 84550 + 21050 = 105600
  expect(summarizeExpenses(sampleExpenses()), "totals of the sample").toEqual({
    total: 185590,
    byCategory: { food: 105600, transport: 52000, home: 9990, fun: 18000 },
  });
});

test("summarizeExpenses of an empty list is all zeros", () => {
  expect(summarizeExpenses([]), "totals of []").toEqual({ total: 0, byCategory: { food: 0, transport: 0, home: 0, fun: 0 } });
});

test("filterExpenses keeps only the expenses of the category", () => {
  expect(filterExpenses(sampleExpenses(), "food").map((expense) => expense.id), "food").toEqual(["e-01", "e-06"]);
  expect(filterExpenses(sampleExpenses(), "home").map((expense) => expense.id), "home").toEqual(["e-04"]);
});

test("sortExpenses sorts by amount and by date", () => {
  const list = sampleExpenses();
  expect(sortExpenses(list, "amountMinor").map((expense) => expense.id), "by amountMinor").toEqual(["e-04", "e-03", "e-06", "e-02", "e-01"]);
  expect(sortExpenses(list, "date").map((expense) => expense.id), "by date").toEqual(["e-06", "e-02", "e-03", "e-01", "e-04"]);
  expect(list.map((expense) => expense.id), "the list passed in").toEqual(["e-01", "e-02", "e-03", "e-04", "e-06"]);
});

test("parseAmountMinor reads typed hryvnias as whole kopiykas", () => {
  expect(parseAmountMinor("845,50"), "845,50").toBe(84550);
  expect(parseAmountMinor(" 12,5 "), "12,5").toBe(1250);
  expect(parseAmountMinor("0.1"), "0.1").toBe(10);
  expect(parseAmountMinor("520"), "520").toBe(52000);
  expect(Number.isNaN(parseAmountMinor("12,345")), "three digits after the mark").toBe(true);
  expect(Number.isNaN(parseAmountMinor("")), "empty text").toBe(true);
});

test("validateExpense rejects a date that is not YYYY-MM-DD", () => {
  const draft = (date) => ({ label: "%%fixture1Name%%", amountMinor: 100, date: date, category: "food" });
  expect(validateExpense(draft("01.03.2026")), "01.03.2026").toEqual({ ok: false, errors: { date: "bad-date" } });
  expect(validateExpense(draft("")).ok, "no date").toBe(false);
});

test("searchKey gives the same key however the text was typed", () => {
  // The same word typed as one character per letter and with a letter + a combining mark.
  expect(searchKey("  %%unicodeWord%% "), "composed").toBe("%%unicodeKey%%");
  expect(searchKey("%%unicodeWordDecomposed%%"), "decomposed").toBe("%%unicodeKey%%");
  const list = [...sampleExpenses(), { id: "e-09", label: "%%unicodeWord%%", amountMinor: 100, date: "2026-03-01", category: "food" }];
  expect(searchExpenses(list, " %%unicodeQuery%% ").map((expense) => expense.id), "decomposed query").toEqual(["e-09"]);
});

test("totalsByCategory sums every category in a Map", () => {
  const totals = totalsByCategory(sampleExpenses());
  expect(totals instanceof Map, "a Map").toBe(true);
  expect([...totals], "the totals, in the order the categories first appear").toEqual([["food", 105600], ["transport", 52000], ["fun", 18000], ["home", 9990]]);
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
