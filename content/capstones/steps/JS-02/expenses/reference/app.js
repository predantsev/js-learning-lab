// The project script. It runs after the page has loaded.
// It describes two expenses and a draft of a new one, builds the text for the page
// and writes it into the empty paragraphs of index.html.
console.log("%%consoleReady%%");
console.log("%%samplesLabel%%", "%%sample1%%", "%%sample2%%", "%%sample3%%");

// Two expenses of the list. Amounts are whole kopiykas (minor units): 52000 is 520 hryvnias 00 kopiykas.
const firstExpense = { id: "e-02", label: "%%nameValue%%", amountMinor: 52000, date: "2026-03-01", category: "transport" };
const secondExpense = { id: "e-04", label: "%%secondName%%", amountMinor: 9990, date: "2026-02-27", category: "home" };

// A label is the expense label and the amount in hryvnias with two digits of kopiykas.
const firstKopiykas = firstExpense.amountMinor % 100;
const firstHryvnias = (firstExpense.amountMinor - firstKopiykas) / 100;
const firstLabel = firstExpense.label + " — " + firstHryvnias + "%%decimalMark%%" + (firstKopiykas < 10 ? "0" + firstKopiykas : firstKopiykas) + " %%currency%%";

const secondKopiykas = secondExpense.amountMinor % 100;
const secondHryvnias = (secondExpense.amountMinor - secondKopiykas) / 100;
const secondLabel = secondExpense.label + " — " + secondHryvnias + "%%decimalMark%%" + (secondKopiykas < 10 ? "0" + secondKopiykas : secondKopiykas) + " %%currency%%";

// A draft of a new expense, as a form will send it later.
const draft = { label: "%%draftLabel%%", amountMinor: 150.5, date: "2026-03-02", category: "" };

// One message per field; an empty string means the field is fine.
// A whole number leaves a remainder of 0 when divided by 1.
let amountMessage = "";
if (typeof draft.amountMinor !== "number" || draft.amountMinor <= 0 || draft.amountMinor % 1 !== 0) {
  amountMessage = "%%invalidMessage%%";
}

let categoryMessage = "";
if (draft.category === "" || draft.category === null) {
  categoryMessage = "%%requiredMessage%%";
}

// Each line finds the element with this id and writes the text into it.
document.querySelector("#first-label").textContent = firstLabel;
document.querySelector("#second-label").textContent = secondLabel;
document.querySelector("#amount-message").textContent = amountMessage;
document.querySelector("#category-message").textContent = categoryMessage;
