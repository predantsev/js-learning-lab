import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";
import { startTasks } from "./tasks";

// What the starting tasks looked like before any check ran.
const original = JSON.stringify(startTasks);

// Every check shows its own fresh copy of App.
function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  flushSync(() => createRoot(host).render(createElement(App)));
  const field = (label) => [...host.querySelectorAll("form label")].find((l) => l.textContent.includes(label))?.querySelector("input, select") ?? null;
  const rows = () => [...host.querySelectorAll("li")];
  const part = (row, name) => (row.querySelector("." + name)?.textContent ?? "").trim();
  const rowOf = (title) => rows().find((row) => part(row, "title") === title) ?? null;
  const buttonIn = (root, text) => [...root.querySelectorAll("button")].find((b) => b.textContent.trim() === text) ?? null;
  return {
    form: () => host.querySelector("form"),
    title: () => field(L.titleLabel),
    due: () => field(L.dueLabel),
    priority: () => field(L.priorityLabel),
    error: (name) => (host.querySelector(`.${name}-error`)?.textContent ?? "").trim(),
    rows,
    part,
    rowOf,
    titles: () => rows().map((row) => part(row, "title")),
    rowButton: (title, text) => buttonIn(rowOf(title), text),
    filter: (text) => buttonIn(host.querySelector(".filter"), text),
    sort: () => host.querySelector(".sort"),
  };
}
async function fillForm(app, title, due, priority) {
  await user.fill(app.title(), title);
  await user.fill(app.due(), due);
  if (priority) await user.select(app.priority(), priority);
}

test("a valid task is added at the end and the form is cleared", async () => {
  const app = mount();
  expect(app.form()?.querySelector("button"), "the submit button before editing").toHaveTextContent(L.add);
  await fillForm(app, L.dentist, "2026-03-10", "high");
  await user.submit(app.form());
  const last = app.rows().at(-1);
  expect(app.rows().length, "number of rows").toBe(5);
  expect(app.part(last, "title"), "title of the last row").toBe(L.dentist);
  expect(app.part(last, "due"), "due date of the last row").toBe("2026-03-10");
  expect(app.part(last, "priority"), "priority of the last row").toBe("high");
  expect(app.part(last, "status"), "status of the last row").toBe(L.statusPending);
  expect(app.title(), "the title field after adding").toHaveValue("");
  expect(app.due(), "the due date field after adding").toHaveValue("");
});

test("an empty due date adds a task without a due date", async () => {
  const app = mount();
  await fillForm(app, L.wardrobe, "");
  await user.submit(app.form());
  expect(app.part(app.rows().at(-1), "due"), "due date of the new row").toBe(L.noDue);
});

test("an empty title and a wrong date show their messages and add nothing", async () => {
  const app = mount();
  await fillForm(app, "", "2026-3-5");
  await user.submit(app.form());
  expect(app.error("title"), "text of .title-error").toBe(L.required);
  expect(app.error("due"), "text of .due-error").toBe(L.badDate);
  expect(app.rows().length, "number of rows").toBe(4);
});

test("submitting does not reload the page", async () => {
  const app = mount();
  await fillForm(app, L.dentist, "");
  const { prevented } = await user.submit(app.form());
  expect(prevented, "preventDefault was called during the submit event").toBe(true);
});

test("Edit fills the form, and switching tasks mid-edit shows the other task", async () => {
  const app = mount();
  await user.click(app.rowButton(L.waterPlants, L.edit));
  expect(app.title(), "the title field after Edit").toHaveValue(L.waterPlants);
  expect(app.form().querySelector("button"), "the submit button while editing").toHaveTextContent(L.save);
  await user.type(app.title(), L.more);
  await user.click(app.rowButton(L.libraryBooks, L.edit));
  expect(app.title(), "the title field after switching").toHaveValue(L.libraryBooks);
  expect(app.due(), "the due date field after switching").toHaveValue("2026-03-01");
  expect(app.priority(), "the priority after switching").toHaveValue("high");
});

test("saving an edit changes only that task, keeps its status and empties the form", async () => {
  const app = mount();
  await user.click(app.rowButton(L.payBill, L.edit));
  await user.fill(app.title(), L.payBillOnline);
  await user.submit(app.form());
  expect(app.titles(), "titles of the rows").toEqual([L.waterPlants, L.libraryBooks, L.grandma, L.payBillOnline]);
  expect(app.part(app.rowOf(L.payBillOnline), "status"), "status of the edited task").toBe(L.statusDone);
  expect(app.title(), "the title field after saving").toHaveValue("");
});

test("quick toggles in one go are not lost", async () => {
  const app = mount();
  const toggleWater = app.rowButton(L.waterPlants, L.toggle);
  toggleWater.click();
  toggleWater.click();
  app.rowButton(L.libraryBooks, L.toggle).click();
  app.rowButton(L.grandma, L.toggle).click();
  await settle();
  expect(app.part(app.rowOf(L.waterPlants), "status"), "status after two quick toggles").toBe(L.statusPending);
  expect(app.part(app.rowOf(L.libraryBooks), "status"), "status of the second task").toBe(L.statusDone);
  expect(app.part(app.rowOf(L.grandma), "status"), "status of the third task").toBe(L.statusDone);
});

test("the status filter keeps its choice while editing and follows changes", async () => {
  const app = mount();
  await user.click(app.filter(L.pending));
  expect(app.titles(), "rows under the Pending filter").toEqual([L.waterPlants, L.libraryBooks, L.grandma]);
  await user.click(app.rowButton(L.grandma, L.edit));
  await user.fill(app.title(), L.grandmaLetter);
  await user.submit(app.form());
  expect(app.titles(), "rows under the Pending filter after saving").toEqual([L.waterPlants, L.libraryBooks, L.grandmaLetter]);
  await user.click(app.rowButton(L.libraryBooks, L.toggle));
  expect(app.titles(), "rows under the Pending filter after a toggle").toEqual([L.waterPlants, L.grandmaLetter]);
});

test("sorting by due date moves the rows without replacing them", async () => {
  const app = mount();
  const rowsBefore = new Map(app.rows().map((row) => [app.part(row, "title"), row]));
  await user.click(app.sort());
  expect(app.titles(), "titles after sorting").toEqual([L.payBill, L.libraryBooks, L.waterPlants, L.grandma]);
  for (const row of app.rows()) {
    expect(row === rowsBefore.get(app.part(row, "title")), `the row of “${app.part(row, "title")}” is the same element as before sorting`).toBe(true);
  }
});

test("Delete removes only that task", async () => {
  const app = mount();
  await user.click(app.rowButton(L.libraryBooks, L.delete));
  expect(app.titles(), "titles of the rows").toEqual([L.waterPlants, L.grandma, L.payBill]);
});

test("the starting tasks stay unchanged", async () => {
  const app = mount();
  await user.click(app.rowButton(L.waterPlants, L.toggle));
  await user.click(app.rowButton(L.payBill, L.edit));
  await user.fill(app.title(), L.payBillOnline);
  await user.submit(app.form());
  await user.click(app.rowButton(L.grandma, L.delete));
  expect(JSON.stringify(startTasks), "the startTasks array and its task objects").toBe(original);
});
