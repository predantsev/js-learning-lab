import { test, expect } from "./testing.js";
import { validateHabit } from "./habits.js";

test("%%tTypical%%", () => {
  expect(validateHabit({ name: "%%h03%%", frequency: "daily" }).ok, "%%mTypical%%").toBe(true);
});

// The same boundaries as a table: label, draft, expected ok.
const rows = [
  ["%%tEmpty%%", { name: "" }, false],
  ["%%tSpaces%%", { name: " \t " }, false],
  ["%%t80%%", { name: "%%h06%%".padEnd(80, "!") }, true],
  ["%%t81%%", { name: "%%h06%%".padEnd(81, "!") }, false],
  ["%%tNoFrequency%%", { name: "%%h06%%" }, true],
];

for (const [label, draft, ok] of rows) {
  test(label, () => {
    expect(validateHabit(draft).ok, label).toBe(ok);
  });
}
