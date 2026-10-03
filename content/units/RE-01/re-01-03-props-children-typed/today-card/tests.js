import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Card } from "./Card";

function renderCard(props, ...children) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  flushSync(() => root.render(createElement(Card, props, ...children)));
  return { host, done: () => { root.unmount(); host.remove(); } };
}
function withCard(props, children, check) {
  expect(typeof Card, "type of Card").toBe("function");
  const view = renderCard(props, ...children);
  try {
    check(view.host);
  } finally {
    view.done();
  }
}

test("Card shows its title in an h2", () => {
  withCard({ title: L.testTitle }, [createElement("p", null, "x")], (host) => {
    expect(host.querySelector("h2"), "the h2 heading of the Card").toHaveTextContent(L.testTitle);
  });
});

test("Card shows the children it is given after the heading", () => {
  withCard({ title: L.testTitle }, [createElement("p", { key: "a" }, L.first), createElement("p", { key: "b" }, L.second)], (host) => {
    const h2 = host.querySelector("h2");
    const paragraphs = [...host.querySelectorAll("p")];
    expect(paragraphs.map((p) => p.textContent), "the children shown by Card").toEqual([L.first, L.second]);
    expect(Boolean(h2 && h2.compareDocumentPosition(paragraphs[0]) & Node.DOCUMENT_POSITION_FOLLOWING), "the children come after the h2").toBe(true);
  });
});

test("Card shows plain text children too", () => {
  withCard({ title: L.testTitle }, [L.first], (host) => {
    expect(host.textContent, "the text of the Card").toContain(L.first);
  });
});

test("the page shows both task cards inside a Card titled with today", async () => {
  await settle();
  const root = document.getElementById("root");
  const heading = [...root.querySelectorAll("h2")].find((h) => h.textContent.trim() === L.today);
  expect(heading, `an h2 heading “${L.today}” on the page`).toBeTruthy();
  const wrapper = heading.parentElement;
  expect(wrapper.querySelectorAll("article"), "task cards inside the element that holds that heading").toHaveLength(2);
  expect(wrapper.textContent, "the text inside the Card").toContain(L.water);
  expect(wrapper.textContent, "the text inside the Card").toContain(L.grandma);
});
