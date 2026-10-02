// Hidden state: other code changes view.category before calling renderReport.
export const view = { category: "all" };

// Filters, sums and draws the expense report — all in one function.
export function renderReport(root, expenses) {
  root.replaceChildren();
  let total = 0;
  let count = 0;
  for (const e of expenses) {
    if (view.category === "all" || e.category === view.category) {
      total = total + e.amountMinor;
      count = count + 1;
    }
  }
  const heading = document.createElement("h2");
  heading.textContent = `${count} %%expenses%%`;
  const sum = document.createElement("p");
  sum.textContent = `%%total%% ${Math.round(total / 100)} %%currency%%`;
  const list = document.createElement("ul");
  for (const e of expenses) {
    if (view.category === "all" || e.category === view.category) {
      const item = document.createElement("li");
      item.textContent = e.label;
      list.append(item);
    }
  }
  root.append(heading, sum, list);
}
