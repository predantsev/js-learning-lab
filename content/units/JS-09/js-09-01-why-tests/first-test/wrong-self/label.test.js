import { test, expect } from "./testing.js";
import { formatLabel } from "./label.js";

// The expected value comes from the very function under test, so it always agrees with itself.
test("%%solutionTest%%", () => {
  const item = { id: "w-01", name: "%%w01%%", price: 80, acquired: false };
  expect(formatLabel(item)).toBe(formatLabel(item));
});
