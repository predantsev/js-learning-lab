// The page: the plants due today, each with a button that marks it watered.
import { dueToday, waterPlants, type Plant } from "./plants.js";
import { loadPlants, savePlants } from "./storage.js";

// Keep this markup as it is: the checks look for these elements.
export const MARKUP = `
  <h2 id="due-heading" tabindex="-1">%%dueHeading%%</h2>
  <ul class="due" aria-labelledby="due-heading"></ul>
  <p class="status" role="status"></p>
`;

// A listener on every button, attached again after each render.
export function mount(root: HTMLElement, storage: Pick<Storage, "getItem" | "setItem">, today: string): void {
  root.innerHTML = MARKUP;
  const list = root.querySelector(".due") as HTMLElement;
  const status = root.querySelector(".status") as HTMLElement;
  const heading = root.querySelector("#due-heading") as HTMLElement;
  let plants: Plant[] = loadPlants(storage);

  function render(focusAt: number | null): void {
    list.innerHTML = "";
    const due = dueToday(plants, today);
    due.forEach((plant, index) => {
      const item = document.createElement("li");
      item.textContent = `${plant.name} · ${plant.location}`;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `%%markWatered%%: ${plant.name}`;
      button.addEventListener("click", () => {
        plants = waterPlants(plants, [plant.id], today);
        savePlants(storage, plants);
        status.textContent = `${plant.name} — %%wateredNow%%`;
        render(index);
      });
      item.append(button);
      list.append(item);
    });
    if (focusAt === null) return;
    const buttons = list.querySelectorAll("button");
    if (buttons.length === 0) heading.focus();
    else buttons[Math.min(focusAt, buttons.length - 1)].focus();
  }
  render(null);
}
