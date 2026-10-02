import { test, expect } from "./testing.js";
import { formatLabel } from "./label.js";

// The expected text was written from memory: the colon is missing.
test("%%solutionTest%%", () => {
  const item = { id: "w-01", name: "%%w01%%", price: 80, acquired: false };
  expect(formatLabel(item)).toBe("%%w01%% 80");
});
