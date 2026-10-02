import { test, expect } from "./testing.js";
import { formatLabel } from "./label.js";

// Write your first test below: a sample wish, a call to formatLabel and the exact text you expect.
test("%%solutionTest%%", () => {
  const item = { id: "w-01", name: "%%w01%%", price: 80, acquired: false };
  expect(formatLabel(item)).toBe("%%w01%%: 80");
});
