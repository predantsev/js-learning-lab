import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { HabitBoard } from "./HabitBoard";
import { habits } from "./habits.js";

const rowOf = (id) => document.querySelector(`#root li[data-habit="${id}"]`);
function renderOwn(input) {
  expect(typeof HabitBoard, "type of HabitBoard").toBe("function");
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(createElement(HabitBoard, { habits: input })));
    return [...host.querySelectorAll("li[data-habit]")].map((li) => li.dataset.habit);
  } finally {
    root.unmount();
    host.remove();
  }
}
const sample = () => [
  { id: "x-1", name: "A", completions: ["2026-03-01"] },
  { id: "x-2", name: "B", completions: [] },
  { id: "x-3", name: "C", completions: ["2026-02-28", "2026-03-01"] },
];

test("the rows show the most completed habits first, with their days", () => {
  expect(renderOwn(sample()), "the order of the rows").toEqual(["x-3", "x-1", "x-2"]);
});

test("rendering leaves the habits array in its order", () => {
  const input = sample();
  renderOwn(input);
  expect(input.map((habit) => habit.id), "the order of the habits prop after rendering").toEqual(["x-1", "x-2", "x-3"]);
});

test("rendering writes nothing to storage", () => {
  const before = JSON.stringify(Object.entries(storage));
  renderOwn(sample());
  renderOwn(sample());
  expect(JSON.stringify(Object.entries(storage)), "the storage after two renders").toBe(before);
});

test("a re-render with the same data changes nothing in the DOM", async () => {
  await settle();
  const seen = logs().length;
  await user.click(screen.byRole("button", { name: L.again }));
  await settle();
  expect(logs().slice(seen).filter((line) => line.startsWith("DOM:")), "DOM changes after “" + L.again + "”").toEqual([]);
  expect(document.querySelector("#root [data-newest]"), "the newest-habit line").toHaveTextContent(habits.at(-1).name);
});

test("a typed note stays with its habit after the row above is deleted", async () => {
  await settle();
  expect(rowOf("h-02"), "the row of h-02").toBeTruthy();
  await user.type(rowOf("h-02").querySelector("input"), L.typed);
  await user.click(rowOf("h-01").querySelector("button"));
  await settle();
  expect(rowOf("h-01"), "the row of the deleted h-01").toBeNull();
  expect(rowOf("h-02").querySelector("input").value, "the note of h-02 after the delete").toBe(L.typed);
  expect(rowOf("h-04").querySelector("input").value, "the note of h-04 after the delete").toBe("");
});
