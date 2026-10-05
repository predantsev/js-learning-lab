import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { TaskList } from "./TaskList";
import { tasks } from "./tasks.js";

const ids = (list) => list.map((task) => task.id);
function renderList(input) {
  expect(typeof TaskList, "type of TaskList").toBe("function");
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(createElement(TaskList, { tasks: input })));
    return [...host.querySelectorAll("li")].map((li) => li.textContent);
  } finally {
    root.unmount();
    host.remove();
  }
}
const sample = () => [
  { id: "x-1", title: "A", dueDate: "2026-04-03" },
  { id: "x-2", title: "B", dueDate: null },
  { id: "x-3", title: "C", dueDate: "2026-04-01" },
];

test("TaskList shows the tasks by due date, without a date last", () => {
  const shown = renderList(sample());
  expect(shown.map((text) => text.split(" · ")[0]), "the order of the titles").toEqual(["C", "A", "B"]);
});

test("TaskList leaves the array it was given in its order", () => {
  const input = sample();
  renderList(input);
  expect(ids(input), "the order of the tasks prop after rendering").toEqual(["x-1", "x-2", "x-3"]);
});

test("the list as written keeps its order after a re-render", async () => {
  await settle();
  await user.click(screen.byRole("button"));
  await settle();
  const asWritten = [...document.querySelectorAll("#root ol:not([data-list]) li")].map((li) => li.textContent);
  expect(asWritten, "the list as written after the button").toEqual(tasks.map((task) => task.title));
  expect(ids(tasks), "the order of the tasks array in tasks.js").toEqual(["t-01", "t-02", "t-03", "t-05"]);
});
