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
  const card = document.createElement("article");
  card.className = "expense-card";
  card.innerHTML = `
    <h3 title="${expense.label}">${expense.label}</h3>
    <p class="amount">${formatMinor(expense.amountMinor)}</p>
    <p class="category">${CATEGORY_LABELS[expense.category]}</p>`;
  return card;
}

function showSearch(term) {
  document.querySelector("#search").innerHTML = `%%resultsFor%% ${term}`;
}

// Every untrusted value the page shows: where it comes from, its output context, the API.
// source: "form field" | "URL query" | "localStorage" | "fetched JSON"
// context: "text" | "attribute" | "url" | "html"
const OUTPUTS = [
  { value: "expense.label in the heading", source: "", context: "", api: "" },
  { value: "expense.label in the heading's tooltip", source: "", context: "", api: "" },
  { value: "the search term after “%%resultsFor%%”", source: "", context: "", api: "" },
];

const expenses = await (await fetch("./data/expenses.json")).json();
document.querySelector("#expenses").append(...expenses.map(renderRecordCard));
showSearch(new URLSearchParams(PAGE_QUERY).get("q"));
