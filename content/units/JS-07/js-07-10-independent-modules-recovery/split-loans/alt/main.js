import * as domain from "./domain/loans.js";
import { loadLoans as readLoans, saveLoans } from "./storage/loans.js";
import { render } from "./ui/render.js";

const TODAY = "2026-03-02";
const MESSAGES = { damaged: "%%damaged%%" };
const FIXTURES = [
  { id: "l-01", title: "%%book1%%", dueDate: "2026-03-05", returned: false },
  { id: "l-02", title: "%%book2%%", dueDate: "2026-02-27", returned: false },
  { id: "l-03", title: "%%book3%%", dueDate: "2026-02-20", returned: true },
];

let loans = FIXTURES;

function start(storage) {
  const result = readLoans(storage);
  let message = "";
  if (result.ok) {
    loans = result.loans;
  } else {
    loans = FIXTURES;
    if (result.reason !== "missing") {
      message = MESSAGES.damaged;
    }
  }
  render(loans, message, domain.countOverdue(loans, TODAY));
  saveLoans(storage, loans);
}

const statsArea = document.querySelector("#stats");
document.querySelector("#stats-button").addEventListener("click", () => {
  import("./stats.js").then(
    (stats) => {
      statsArea.textContent = "%%statsText%%" + stats.overdueShare(loans, TODAY) + "%";
    },
    () => {
      statsArea.textContent = "";
    },
  );
});

start(localStorage);
