import { test, expect } from "./testing.js";
import { dueToday, isDue, parsePlants, waterPlants } from "./plants.js";
import { loadPlants, savePlants, STORAGE_KEY } from "./storage.js";
import { mount } from "./ui.js";

// Your tests. Start each test name with its level: "unit: …", "integration: …" or "user: …".

// Fixtures: fresh objects for every test and a fixed today, so no test depends on the real date.
const TODAY = "2026-04-10";
const plants = () => [
  { id: "a", name: "Aloe", location: "hall", intervalDays: 5, lastWatered: "2026-04-05", status: "ok" },
  { id: "b", name: "Begonia", location: "hall", intervalDays: 5, lastWatered: "2026-04-06", status: "ok" },
  { id: "c", name: "Cactus", location: "sill", intervalDays: 3, lastWatered: "2026-03-01", status: "resting" },
  { id: "d", name: "Dill", location: "kitchen", intervalDays: 9, lastWatered: "2026-04-09", status: "thirsty" },
];
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
}

test("unit: an ok plant is due on the day its interval ends, not the day before", () => {
  const [aloe, begonia] = plants();
  expect(isDue(aloe, TODAY)).toBe(true);
  expect(isDue(begonia, TODAY)).toBe(false);
});

test("unit: a resting plant is never due, a thirsty one always is", () => {
  expect(dueToday(plants(), TODAY).map((plant) => plant.id)).toEqual(["a", "d"]);
});

test("unit: watering copies the plant and leaves the list passed in alone", () => {
  const before = plants();
  const after = waterPlants(before, ["b"], TODAY);
  expect(after[1].lastWatered).toBe(TODAY);
  expect(before[1].lastWatered).toBe("2026-04-06");
  expect(after[0]).toBe(before[0]);
});

test("unit: parsePlants keeps only valid records", () => {
  const input = [plants()[0], { id: "x", name: " ", location: "", intervalDays: 2, lastWatered: "2026-04-01", status: "ok" }, null];
  expect(parsePlants(input)).toEqual([plants()[0]]);
  expect(parsePlants("plants")).toEqual([]);
});

test("integration: saved plants come back after a reload", () => {
  const storage = fakeStorage();
  savePlants(storage, plants());
  expect(loadPlants(storage)).toEqual(plants());
});

test("integration: broken stored text gives an empty list instead of an error", () => {
  expect(loadPlants(fakeStorage({ [STORAGE_KEY]: "{not json" }))).toEqual([]);
});

test("user: pressing a button marks the plant watered and saves it", () => {
  const storage = fakeStorage();
  savePlants(storage, plants());
  const root = document.createElement("div");
  document.body.append(root);
  try {
    mount(root, storage, TODAY);
    expect(root.querySelectorAll("li").length).toBe(2);
    root.querySelector("li button").click();
    expect(root.querySelectorAll("li").length).toBe(1);
    expect(loadPlants(storage)[0].lastWatered).toBe(TODAY);
  } finally {
    root.remove();
  }
});
