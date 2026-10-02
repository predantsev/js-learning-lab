// Your tests from the testing unit, written with the course runner testing.js.
import { test, expect } from "../testing.js";
import { completionRate } from "./habits.js";

test("3 of 4 planned days is 75 percent", () => {
  expect(completionRate(3, 4)).toBe(75);
});

test("no planned days gives 0, not NaN", () => {
  expect(completionRate(0, 0)).toBe(0);
});
