// Mounts the wishlist and keeps focus on the same wish after a toggle. Read-only.
import { WISH_COUNT, makeWishes } from "./data.js";
import { renderWishes } from "./render.js";

let wishes = makeWishes(WISH_COUNT);
const container = document.querySelector("#wishes");
renderWishes(container, wishes);

container.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  const id = button.dataset.id;
  wishes = wishes.map((wish) => (wish.id === id ? { ...wish, acquired: !wish.acquired } : wish));
  renderWishes(container, wishes);
  container.querySelector(`button[data-id="${id}"]`)?.focus();
});

document.querySelector("#measure").addEventListener("click", () => {
  const times = [];
  for (let run = 0; run < 5; run++) {
    const start = performance.now();
    renderWishes(container, wishes);
    times.push(performance.now() - start);
  }
  const median = times.toSorted((a, b) => a - b)[2];
  const text = `${WISH_COUNT} %%wishes%%: %%median%% ${median.toFixed(0)} ms`;
  document.querySelector("#status").textContent = text;
  console.log(text);
});
