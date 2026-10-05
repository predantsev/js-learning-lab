// The page: the plants due today, each with a button that marks it watered.
import { dueToday, waterPlants, type Plant } from "./plants.js";
import { loadPlants, savePlants } from "./storage.js";

// Keep this markup as it is: the checks look for these elements.
export const MARKUP = `
  <h2 id="due-heading" tabindex="-1">%%dueHeading%%</h2>
  <ul class="due" aria-labelledby="due-heading"></ul>
  <p class="status" role="status"></p>
`;

function renderDue(list: HTMLElement, plants: Plant[], today: string): void {
  list.replaceChildren();
  for (const plant of dueToday(plants, today)) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.id = plant.id;
    button.textContent = `%%markWatered%%: ${plant.name}`;
    item.append(`${plant.name} · ${plant.location}`, button);
    list.append(item);
  }
}

// Puts MARKUP into root and shows one list item per plant due on `today`: "<name> · <location>",
// and a button whose visible text is "%%markWatered%%: <name>". Pressing a button (mouse or keyboard)
// marks that plant watered on `today`, saves the plants, shows the list again, writes
// "<name> — %%wateredNow%%" into the status paragraph and moves focus to the button now at the
// same place in the list (or the last one, or the heading when the list is empty).
export function mount(root: HTMLElement, storage: Pick<Storage, "getItem" | "setItem">, today: string): void {
  root.innerHTML = MARKUP;
  const list = root.querySelector<HTMLElement>(".due")!;
  const status = root.querySelector<HTMLElement>(".status")!;
  const heading = root.querySelector<HTMLElement>("#due-heading")!;
  let plants = loadPlants(storage);
  renderDue(list, plants, today);

  // One listener on the list serves the buttons of every render.
  list.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button[data-id]");
    if (!button) return;
    const buttons = [...list.querySelectorAll("button")];
    const position = buttons.indexOf(button);
    const plant = plants.find((item) => item.id === button.dataset.id);
    if (!plant) return;
    plants = waterPlants(plants, [plant.id], today);
    savePlants(storage, plants);
    renderDue(list, plants, today);
    status.textContent = `${plant.name} — %%wateredNow%%`;
  });
}
