import { test, expect } from "./testing.js";
import { countActive } from "./habits.js";
import { habits } from "./fixtures.js";

test("%%tPause%%", () => {
  habits[0].active = false;
  expect(countActive(habits), "%%mPause%%").toBe(2);
});

test("%%tCount%%", () => {
  expect(countActive(habits), "%%mCount%%").toBe(3);
});
