import { CATEGORIES } from "./data.js";

// The text of a price for the person reading the list.
export function formatPrice(price) {
  if (price === null) {
    return "%%noPrice%%";
  }
  return price.toLocaleString("%%locale%%", { style: "currency", currency: "UAH", maximumFractionDigits: 0 });
}

function categoryName(id) {
  return CATEGORIES.find((category) => category.id === id)?.name ?? "—";
}

// One <li> per wish: its text and a toggle button that page.js uses to keep focus.
// Another valid approach: a cache of price texts that lives for one render.
export function renderWishes(container, wishes) {
  const priceTexts = new Map();
  container.replaceChildren();
  for (const wish of wishes) {
    if (!priceTexts.has(wish.price)) {
      priceTexts.set(wish.price, formatPrice(wish.price));
    }
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = `${wish.name} · ${categoryName(wish.category)} · ${priceTexts.get(wish.price)}`;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.id = wish.id;
    button.setAttribute("aria-pressed", String(wish.acquired));
    button.textContent = "%%acquired%%";
    item.append(text, " ", button);
    container.append(item);
  }
}
