import { CATEGORIES } from "./data.js";

// The text of a price for the person reading the list.
// Another valid approach: remember the text of every price already formatted.
const priceTexts = new Map();
export function formatPrice(price) {
  if (price === null) {
    return "%%noPrice%%";
  }
  if (!priceTexts.has(price)) {
    priceTexts.set(price, price.toLocaleString("%%locale%%", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }));
  }
  return priceTexts.get(price);
}

function categoryName(id) {
  return CATEGORIES.find((category) => category.id === id)?.name ?? "—";
}

// One <li> per wish: its text and a toggle button that page.js uses to keep focus.
export function renderWishes(container, wishes) {
  container.replaceChildren();
  for (const wish of wishes) {
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = `${wish.name} · ${categoryName(wish.category)} · ${formatPrice(wish.price)}`;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.id = wish.id;
    button.setAttribute("aria-pressed", String(wish.acquired));
    button.textContent = "%%acquired%%";
    item.append(text, " ", button);
    container.append(item);
  }
}
