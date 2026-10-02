// Library loans: the whole app in one file. Split it into the modules described
// at the top of domain/loans.js, storage/loans.js, ui/render.js and stats.js.

const KEY = "jsll.loans.v1";
const TODAY = "2026-03-02";
const MESSAGES = { damaged: "%%damaged%%" };
const FIXTURES = [
  { id: "l-01", title: "%%book1%%", dueDate: "2026-03-05", returned: false },
  { id: "l-02", title: "%%book2%%", dueDate: "2026-02-27", returned: false },
  { id: "l-03", title: "%%book3%%", dueDate: "2026-02-20", returned: true },
];

function validateLoan(loan) {
  if (typeof loan !== "object" || loan === null) {
    return { ok: false, errors: { loan: "not-an-object" } };
  }
  const errors = {};
  if (typeof loan.id !== "string" || loan.id === "") {
    errors.id = "required";
  }
  if (typeof loan.title !== "string" || loan.title.trim() === "") {
    errors.title = "required";
  }
  if (typeof loan.dueDate !== "string" || loan.dueDate.length !== 10) {
    errors.dueDate = "not-a-day";
  }
  if (typeof loan.returned !== "boolean") {
    errors.returned = "not-boolean";
  }
  const hasErrors = Object.keys(errors).length > 0;
  return hasErrors ? { ok: false, errors: errors } : { ok: true, value: loan };
}

function countOverdue(loans, today) {
  return loans.filter((loan) => !loan.returned && loan.dueDate < today).length;
}

// The share of open loans that are overdue, in whole percent. Rarely used.
function overdueShare(loans, today) {
  const open = loans.filter((loan) => !loan.returned);
  if (open.length === 0) {
    return 0;
  }
  return Math.round((countOverdue(loans, today) / open.length) * 100);
}

// Trusts whatever is saved.
function loadLoans(storage) {
  const text = storage.getItem(KEY);
  if (text === null) {
    return FIXTURES;
  }
  return JSON.parse(text).records;
}

function saveLoans(storage, loans) {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: loans }));
}

function render(loans, message, overdue) {
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

let loans = FIXTURES;

// start(storage): loads the saved loans, shows them and saves them back.
function start(storage) {
  loans = loadLoans(storage);
  render(loans, "", countOverdue(loans, TODAY));
  saveLoans(storage, loans);
}

document.querySelector("#stats-button").addEventListener("click", () => {
  document.querySelector("#stats").textContent = "%%statsText%%" + overdueShare(loans, TODAY) + "%";
});

start(localStorage);
