import { CATEGORIES } from "./data.js";

// The text of a price for the person reading the list.
// Faster, but the text changed: no currency any more.
const priceFormat = new Intl.NumberFormat("%%locale%%");
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
