import { test, expect } from "./testing.js";
import { assertValidPrice } from "./wishes.js";

// Two records built separately, with the same fields.
const saved = { id: "w-02", name: "%%w02%%", price: 45 };
const loaded = { id: "w-02", name: "%%w02%%", price: 45 };

test("%%aA%%", () => {
  expect(loaded.price).toBe(45);
});

test("%%aB%%", () => {
  expect(loaded).toBe(saved);
});

test("%%aC%%", () => {
  expect(loaded).toEqual(saved);
});

test("%%aD%%", () => {
  expect(["w-01", "w-02"]).toEqual(["w-02", "w-01"]);
});

test("%%aE%%", () => {
  expect(() => assertValidPrice(-1)).toThrow(RangeError);
});

test("%%aF%%", () => {
  expect(assertValidPrice(-1)).toThrow(RangeError);
});
