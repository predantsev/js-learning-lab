import { test, expect } from "./testing.js";
import { renderReport, view } from "./report.js";

// Characterization tests: they pin what renderReport shows TODAY, quirks included.
const groceries = { id: "e-01", label: "%%groceries%%", amountMinor: 84550, category: "food" };
const pass = { id: "e-02", label: "%%pass%%", amountMinor: 52000, category: "transport" };
const lunch = { id: "e-06", label: "%%lunch%%", amountMinor: 21050, category: "food" };

function shown(expenses, category) {
  view.category = category;
  const root = document.createElement("section");
  renderReport(root, expenses);
  return [...root.children].map((element) => element.textContent);
}

test("%%tAll%%", () => {
  expect(shown([groceries, pass, lunch], "all"), "%%mShown%%").toEqual([`3 %%expenses%%`, `%%total%% 1576 %%currency%%`, "%%groceries%%%%pass%%%%lunch%%"]);
});

test("%%tFood%%", () => {
  expect(shown([groceries, pass, lunch], "food"), "%%mShown%%").toEqual([`2 %%expenses%%`, `%%total%% 1056 %%currency%%`, "%%groceries%%%%lunch%%"]);
});

test("%%tEmpty%%", () => {
  expect(shown([], "all"), "%%mShown%%").toEqual([`0 %%expenses%%`, `%%total%% 0 %%currency%%`, ""]);
});

test("%%tRounding%%", () => {
  expect(shown([groceries], "all")[1], "%%mShown%%").toBe(`%%total%% 846 %%currency%%`);
});
