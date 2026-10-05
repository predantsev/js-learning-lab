import { test, expect } from "./testing.js";
import { showSummary, view } from "./page.ts";
import { HABITS } from "./fixtures.js";

// Characterization tests: they pin what showSummary shows TODAY. Keep them green at every step.
function shown(query) {
  view.query = query;
  const root = document.createElement("section");
  showSummary(root, HABITS);
  view.query = "";
  return [...root.children].map((element) => element.textContent);
}

test("%%tAll%%", () => {
  expect(shown(""), "%%mShown%%").toEqual([
    "5 %%habits%%",
    "%%doneToday%% 4 · %%completions%% 9",
    "%%exercise%%%%read%%%%water%%%%tidy%%%%walk%%",
  ]);
});

test("%%tCase%%", () => {
  expect(shown("%%qCase%%"), "%%mShown%%").toEqual(["1 %%habits%%", "%%doneToday%% 1 · %%completions%% 3", "%%read%%"]);
});

test("%%tSpaces%%", () => {
  expect(shown("%%qSpaces%%"), "%%mShown%%").toEqual(["0 %%habits%%", "%%doneToday%% 0 · %%completions%% 0", ""]);
});
