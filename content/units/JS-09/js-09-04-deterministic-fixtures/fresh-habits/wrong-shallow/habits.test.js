import { test, expect } from "./testing.js";
import { countActive } from "./habits.js";
import { makeFixtures } from "./fixtures.js";

test("%%tPause%%", () => {
  const habits = makeFixtures();
  habits[0].active = false;
  expect(countActive(habits), "%%mPause%%").toBe(2);
});

test("%%tCount%%", () => {
  const habits = makeFixtures();
  expect(countActive(habits), "%%mCount%%").toBe(3);
});
