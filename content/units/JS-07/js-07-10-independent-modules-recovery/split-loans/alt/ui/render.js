// The page. Export by name:
// - render(loans, message, overdue): shows the message in #message, the overdue count
//   in #summary and one list item per loan in #loans.

export function render(loans, message, overdue) {
  document.querySelector("#message").textContent = message;
  document.querySelector("#summary").textContent = "%%overdueText%%" + overdue;
  const list = document.querySelector("#loans");
  list.replaceChildren();
  for (const loan of loans) {
    const item = document.createElement("li");
    item.textContent = loan.title + " — " + loan.dueDate + (loan.returned ? " · %%returnedText%%" : "");
    list.append(item);
  }
}
