import { test } from "./testing.js";
import { formatLabel } from "./label.js";

// expect was dropped from the import, so the test stops with a ReferenceError.
test("%%solutionTest%%", () => {
  const item = { id: "w-01", name: "%%w01%%", price: 80, acquired: false };
  expect(formatLabel(item)).toBe("%%w01%%: 80");
});
