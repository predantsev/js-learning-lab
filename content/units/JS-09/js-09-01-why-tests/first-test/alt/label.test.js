import { test, expect } from "./testing.js";
import { formatLabel } from "./label.js";

// A wish without a price is a fine sample too.
test("%%altTest%%", () => {
  const item = { id: "w-05", name: "%%w05%%", price: null, acquired: false };
  const label = formatLabel(item);
  expect(label).toBe("%%w05%%: %%noPrice%%");
});
