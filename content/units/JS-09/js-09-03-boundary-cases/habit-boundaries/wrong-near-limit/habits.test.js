import { test, expect } from "./testing.js";
import { validateHabit } from "./habits.js";

test("%%tTypical%%", () => {
  expect(validateHabit({ name: "%%h03%%", frequency: "daily" }).ok, "%%mTypical%%").toBe(true);
});

test("%%tEmpty%%", () => {
  expect(validateHabit({ name: "", frequency: "daily" }), "%%mEmpty%%").toEqual({ ok: false, errors: { name: "required" } });
});

test("%%tSpaces%%", () => {
  expect(validateHabit({ name: "    ", frequency: "daily" }), "%%mSpaces%%").toEqual({ ok: false, errors: { name: "required" } });
});

test("%%t80%%", () => {
  const name = "x".repeat(79);
  expect(validateHabit({ name, frequency: "weekly" }).ok, "%%m80%%").toBe(true);
});

test("%%t81%%", () => {
  const name = "x".repeat(82);
  expect(validateHabit({ name, frequency: "weekly" }), "%%m81%%").toEqual({ ok: false, errors: { name: "too-long" } });
});

test("%%tNoFrequency%%", () => {
  expect(validateHabit({ name: "%%h06%%" }), "%%mNoFrequency%%").toEqual({ ok: true, value: { name: "%%h06%%", frequency: "daily" } });
});
