import { countOverdue } from "./domain/loans.js";
import { loadLoans, saveLoans } from "./storage/loans.js";
import { render } from "./ui/render.js";

const TODAY = "2026-03-02";
const MESSAGES = { damaged: "%%damaged%%" };
const FIXTURES = [
  { id: "l-01", title: "%%book1%%", dueDate: "2026-03-05", returned: false },
  { id: "l-02", title: "%%book2%%", dueDate: "2026-02-27", returned: false },
  { id: "l-03", title: "%%book3%%", dueDate: "2026-02-20", returned: true },
];

let loans = FIXTURES;

// start(storage): loads the saved loans, shows them and saves them back.
function start(storage) {
  const result = loadLoans(storage);
  loans = result.ok ? result.loans : FIXTURES;
  const message = "";
  render(loans, message, countOverdue(loans, TODAY));
  saveLoans(storage, loans);
}

document.querySelector("#stats-button").addEventListener("click", () => {
  import("./stats.js").then((stats) => {
    document.querySelector("#stats").textContent = "%%statsText%%" + stats.overdueShare(loans, TODAY) + "%";
  });
});

start(localStorage);
