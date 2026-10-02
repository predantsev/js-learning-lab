import { test, expect } from "./testing.js";
import { validateName } from "./wishes.js";

// One row per case: a label for the test name, the input, and whether it must be valid.
const cases = [
  ["%%cTypical%%", "%%w03%%", true],
  ["%%cEmpty%%", "", false],
  ["%%cSpaces%%", "   ", false],
  ["%%cOne%%", "a", true],
  ["%%c80%%", "a".repeat(80), true],
  ["%%c81%%", "a".repeat(81), false],
  ["%%c80Padded%%", "  " + "a".repeat(80) + "  ", true],
];

for (const [label, name, valid] of cases) {
  test(label, () => {
    expect(validateName(name).ok, label).toBe(valid);
  });
}
