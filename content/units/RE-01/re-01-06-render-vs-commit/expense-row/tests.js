import { before } from "./expenses.js";

const rowOf = (id) => document.querySelector(`#root tr[data-id="${id}"]`);
const money = (minor) => `${(minor / 100).toFixed(2)} ${L.currency}`;
const squash = (text) => text.replace(/\s+/g, " ").trim();

test("every row shows the label, the formatted amount and the date", async () => {
  await settle();
  expect(document.querySelectorAll("#root tbody tr"), "rows in the table body").toHaveLength(before.length);
  for (const expense of before) {
    const row = rowOf(expense.id);
    expect(row, `the row with data-id ${expense.id}`).toBeTruthy();
    const cells = [...row.querySelectorAll("td")].map((td) => squash(td.textContent));
    expect(cells, `the cells of ${expense.id}`).toEqual([expense.label, money(expense.amountMinor), expense.date]);
  }
});

test("new data changes only the amount text of e-03 in the DOM", async () => {
  await settle();
  const rowBefore = rowOf("e-03");
  expect(rowBefore, "the row with data-id e-03").toBeTruthy();
  const seen = logs().length;
  await user.click(screen.byRole("button", { name: L.next }));
  await settle();
  const domLines = logs().slice(seen).filter((line) => line.startsWith("DOM:"));
  expect(domLines, "DOM changes reported after pressing the button").toHaveLength(1);
  expect(domLines[0], "the only DOM change").toContain("185.50");
  expect(rowOf("e-03"), "the row of e-03 after the update is the same element as before").toBe(rowBefore);
});

test("the render log line is kept in ExpenseRow", async () => {
  await settle();
  expect(logs().filter((line) => line.startsWith("render ExpenseRow")).length, "lines “render ExpenseRow …”").toBeGreaterThanOrEqual(before.length);
});
