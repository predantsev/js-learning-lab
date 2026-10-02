import { test, expect } from "./testing.js";
import { formatLabel } from "./label.js";

// formatLabel is called, but nothing is compared: this test passes whatever formatLabel returns.
test("%%solutionTest%%", () => {
  const item = { id: "w-01", name: "%%w01%%", price: 80, acquired: false };
  formatLabel(item);
});
