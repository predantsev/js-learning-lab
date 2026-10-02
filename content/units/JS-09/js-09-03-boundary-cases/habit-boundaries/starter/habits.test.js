import { test, expect } from "./testing.js";
import { validateHabit } from "./habits.js";

test("%%tTypical%%", () => {
  expect(validateHabit({ name: "%%h03%%", frequency: "daily" }).ok, "%%mTypical%%").toBe(true);
});

// Add one test per boundary: an empty name, a name of spaces only, exactly 80 characters,
// 81 characters, and a draft without the optional frequency field.
