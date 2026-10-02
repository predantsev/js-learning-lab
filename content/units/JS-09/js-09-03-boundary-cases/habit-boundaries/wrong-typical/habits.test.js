import { test, expect } from "./testing.js";
import { validateHabit } from "./habits.js";

test("%%tTypical%%", () => {
  expect(validateHabit({ name: "%%h03%%", frequency: "daily" }).ok, "%%mTypical%%").toBe(true);
});

test("%%tOther%%", () => {
  expect(validateHabit({ name: "%%h01%%", frequency: "daily" }).ok, "%%mTypical%%").toBe(true);
  expect(validateHabit({ name: "%%h04%%", frequency: "weekly" }).ok, "%%mTypical%%").toBe(true);
});
