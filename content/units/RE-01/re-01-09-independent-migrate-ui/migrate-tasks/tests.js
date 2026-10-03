import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import * as ui from "./components";
import { tasks, TODAY } from "./tasks";
import { countDueTasks } from "./domain";

function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  return {
    host,
    show: (name, props, ...children) => flushSync(() => root.render(createElement(ui[name], props, ...children))),
    done: () => { root.unmount(); host.remove(); },
  };
}
function withView(name, props, check, ...children) {
  expect(typeof ui[name], `type of the exported ${name}`).toBe("function");
  const view = mount();
  try {
    view.show(name, props, ...children);
    check(view.host, view);
  } finally {
    view.done();
  }
}
const squash = (text) => text.replace(/\s+/g, " ").trim();
const texts = (nodes) => [...nodes].map((node) => squash(node.textContent));
const task = (id, extra) => ({ id, title: `T ${id}`, dueDate: "2026-03-02", done: false, priority: "normal", ...extra });

test("App shows a Card with the heading, the due count and the list", () => {
  withView("App", { tasks, today: TODAY }, (host) => {
    expect(host.querySelector("section h2"), "the h2 heading inside a section").toHaveTextContent(L.heading);
    expect(texts(host.querySelectorAll("p")), "the paragraphs").toContain(`${L.dueNow}: 2`);
    expect(host.querySelectorAll("ul > li[data-id]"), "the task items").toHaveLength(tasks.length);
  });
});

test("the due count is what countDueTasks returns", () => {
  const sample = [task("a", { dueDate: "2026-01-01", done: true }), task("b", { dueDate: null }), task("c", { dueDate: "2026-05-05" }), task("d")];
  withView("App", { tasks: sample, today: "2026-05-05" }, (host) => {
    expect(texts(host.querySelectorAll("p")), "the paragraphs").toContain(`${L.dueNow}: ${countDueTasks(sample, "2026-05-05")}`);
  });
});

test("RecordCard shows the title, the due date and the status", () => {
  withView("RecordCard", { task: tasks[3] }, (host) => {
    const li = host.querySelector("li[data-id]");
    expect(li?.dataset.id, "the data-id of the item").toBe(tasks[3].id);
    expect(li.querySelector("h3"), "the h3 heading").toHaveTextContent(tasks[3].title);
    expect(texts(li.querySelectorAll("p")), "the paragraphs of the card").toEqual([tasks[3].dueDate, L.doneLabel]);
  });
});

test("a task without a due date says so", () => {
  withView("RecordCard", { task: tasks[2] }, (host) => {
    expect(texts(host.querySelectorAll("li p")), "the paragraphs of the card").toEqual([L.noDue, L.pendingLabel]);
  });
});

test("an empty list shows only the empty-state message", () => {
  withView("RecordList", { tasks: [] }, (host) => {
    expect(host.querySelector("ul"), "a <ul> for an empty list").toBeNull();
    expect(squash(host.textContent), "the whole text").toBe(L.empty);
  });
});

test("Card shows its title and its children", () => {
  withView("Card", { title: "X" }, (host) => {
    expect(host.querySelector("h2"), "the h2 heading").toHaveTextContent("X");
    expect(host.querySelector("p"), "the child paragraph").toHaveTextContent("child");
  }, createElement("p", null, "child"));
});

test("a reorder keeps each card element with its task", () => {
  expect(typeof ui.RecordList, "type of the exported RecordList").toBe("function");
  const view = mount();
  try {
    view.show("RecordList", { tasks });
    const before = view.host.querySelector('li[data-id="t-02"]');
    view.show("RecordList", { tasks: tasks.toReversed() });
    expect([...view.host.querySelectorAll("li[data-id]")].map((li) => li.dataset.id), "the order after reversing").toEqual(tasks.toReversed().map((t) => t.id));
    expect(view.host.querySelector('li[data-id="t-02"]'), "the element of t-02 after reversing is the same element as before").toBe(before);
  } finally {
    view.done();
  }
});

test("a title with markup is shown as text", () => {
  withView("RecordCard", { task: task("m", { title: "<em>Lamp</em>" }) }, (host) => {
    expect(host.querySelector("h3"), "the h3 heading").toHaveTextContent("<em>Lamp</em>");
    expect(host.querySelector("em"), "an <em> element made from the title").toBeNull();
  });
});

test("the page is rendered by React from App", async () => {
  await settle();
  const root = document.getElementById("root");
  expect(Object.keys(root).some((key) => key.startsWith("__reactContainer")), "#root is a React root (createRoot)").toBe(true);
  expect(root.querySelectorAll("li[data-id]"), "the task items on the page").toHaveLength(tasks.length);
});

test("React gives no key warning", () => {
  expect(rawLogs().filter((entry) => entry.level === "error" && /key/.test(String(entry.args[0]))).length, "key warnings in the console").toBe(0);
});
