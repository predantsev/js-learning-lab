import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { HabitCard } from "./HabitCard";
import { habit } from "./habit.js";

function renderCard() {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  flushSync(() => root.render(createElement(HabitCard)));
  return { host, done: () => { root.unmount(); host.remove(); } };
}
function withCard(check) {
  expect(typeof HabitCard, "type of HabitCard").toBe("function");
  const view = renderCard();
  try {
    check(view.host);
  } finally {
    view.done();
  }
}
// A project SVG is shown through a data: URL with the file's content.
const showsFile = (img, path) => {
  const src = img.getAttribute("src");
  return src === path || src === `data:image/svg+xml;charset=utf-8,${encodeURIComponent(files[path])}`;
};
const htmlNameWarnings = () => rawLogs().filter((entry) => entry.level === "error" && String(entry.args[0]).startsWith("Invalid DOM property") && ["class", "for"].includes(entry.args[1]));

test("the card is an article with the class habit-card and an h3 with the name", () => {
  withCard((host) => {
    const article = host.querySelector("article");
    expect(article, "an <article> element").toBeTruthy();
    expect(article, "the <article>").toHaveClass("habit-card");
    expect(host.querySelector("h3"), "the h3 heading").toHaveTextContent(habit.name);
  });
});

test("the image shows img/habit.svg with alt text built from the name", () => {
  withCard((host) => {
    const img = host.querySelector("img");
    expect(img, "an <img> element").toBeTruthy();
    expect(showsFile(img, "img/habit.svg"), "the img shows img/habit.svg").toBe(true);
    expect(img.getAttribute("alt"), "the alt text").toBe(`${L.iconOf}: ${habit.name}`);
  });
});

test("the label is tied to the output with the count", () => {
  withCard((host) => {
    const label = host.querySelector("label");
    const output = host.querySelector("output");
    expect(label, "a <label> element").toHaveTextContent(L.doneTimes);
    expect(output, "an <output> element").toBeTruthy();
    expect(output.id, "the id of the output").toBe(`${habit.id}-count`);
    expect(label.getAttribute("for"), "the label's for attribute in the DOM").toBe(output.id);
    expect(output.textContent.trim(), "the text of the output").toBe(String(habit.completions.length));
  });
});

test("JSX attribute names are used: className and htmlFor", () => {
  expect(htmlNameWarnings().map((entry) => entry.args[1]), "HTML attribute names React warned about").toEqual([]);
});

test("every value comes from habit, not copied by hand", () => {
  const saved = { id: habit.id, name: habit.name, completions: habit.completions };
  Object.assign(habit, { id: "h-77", name: L.otherHabit, completions: ["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05"] });
  try {
    withCard((host) => {
      expect(host.querySelector("h3"), "the h3 heading for another habit").toHaveTextContent(L.otherHabit);
      expect(host.querySelector("img")?.getAttribute("alt"), "the alt text for another habit").toBe(`${L.iconOf}: ${L.otherHabit}`);
      expect(host.querySelector("output")?.id, "the id of the output for another habit").toBe("h-77-count");
      expect(host.querySelector("label")?.getAttribute("for"), "the label's for for another habit").toBe("h-77-count");
      expect(host.querySelector("output")?.textContent.trim(), "the count for another habit").toBe("5");
    });
  } finally {
    Object.assign(habit, saved);
  }
});
