import { CATEGORIES } from "./data.js";

// One formatter, prepared once: toLocaleString prepared the same rules again for every row.
const priceFormat = new Intl.NumberFormat("%%locale%%", { style: "currency", currency: "UAH", maximumFractionDigits: 0 });

// The text of a price for the person reading the list.
export function formatPrice(price) {
  if (price === null) {
    return "%%noPrice%%";
  }
  return priceFormat.format(price);
}

function categoryName(id) {
  return CATEGORIES.find((category) => category.id === id)?.name ?? "—";
}

// One <li> per wish: its text and a toggle button that page.js uses to keep focus.
// "Batched" into one HTML string: fast, but the buttons lost their data-id.
export function renderWishes(container, wishes) {
  container.innerHTML = wishes
    .map((wish) => `<li><span>${wish.name} · ${categoryName(wish.category)} · ${formatPrice(wish.price)}</span> <button type="button" aria-pressed="${wish.acquired}">%%acquired%%</button></li>`)
    .join("");
}
