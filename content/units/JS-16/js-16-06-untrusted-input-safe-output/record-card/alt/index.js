// The expense page. Labels are typed by people and arrive in a JSON file; the search term comes
// from the page address. Rewrite the two displays so that every untrusted value stays text.
const PAGE_QUERY = "?q=%%searchTerm%%"; // in a real page: location.search

const CATEGORY_LABELS = { food: "%%food%%", transport: "%%transport%%", home: "%%home%%", fun: "%%fun%%" };

function formatMinor(amountMinor) {
  return `${(amountMinor / 100).toFixed(2)} UAH`;
}

// Builds the card of one expense: the label as the heading (with the full label as its tooltip,
// because a long heading is cut off), the amount and the category.
function renderRecordCard(expense) {
  const heading = Object.assign(document.createElement("h3"), { textContent: expense.label, title: expense.label });
  const amount = Object.assign(document.createElement("p"), { className: "amount", textContent: formatMinor(expense.amountMinor) });
  const category = Object.assign(document.createElement("p"), { className: "category", textContent: CATEGORY_LABELS[expense.category] });
  const card = Object.assign(document.createElement("article"), { className: "expense-card" });
  card.replaceChildren(heading, amount, category);
  return card;
}

function showSearch(term) {
  const line = document.querySelector("#search");
  line.replaceChildren(document.createTextNode("%%resultsFor%% "), document.createTextNode(term));
}

// Every untrusted value the page shows: where it comes from, its output context, the API.
// source: "form field" | "URL query" | "localStorage" | "fetched JSON"
// context: "text" | "attribute" | "url" | "html"
const OUTPUTS = [
  { value: "expense.label in the heading", source: "fetched JSON", context: "text", api: "textContent through Object.assign" },
  { value: "expense.label in the heading's tooltip", source: "fetched JSON", context: "attribute", api: "the title property" },
  { value: "the search term after “%%resultsFor%%”", source: "URL query", context: "text", api: "createTextNode" },
];

const expenses = await (await fetch("./data/expenses.json")).json();
document.querySelector("#expenses").append(...expenses.map(renderRecordCard));
showSearch(new URLSearchParams(PAGE_QUERY).get("q"));
