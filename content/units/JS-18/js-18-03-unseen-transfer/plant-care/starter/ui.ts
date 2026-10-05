// The page: the plants due today, each with a button that marks it watered.
import { dueToday, waterPlants } from "./plants.js";
import { loadPlants, savePlants } from "./storage.js";

// Keep this markup as it is: the checks look for these elements.
export const MARKUP = `
  <h2 id="due-heading" tabindex="-1">%%dueHeading%%</h2>
  <ul class="due" aria-labelledby="due-heading"></ul>
  <p class="status" role="status"></p>
`;

// Puts MARKUP into root and shows one list item per plant due on `today`: "<name> · <location>",
// and a button whose visible text is "%%markWatered%%: <name>". Pressing a button (mouse or keyboard)
// marks that plant watered on `today`, saves the plants, shows the list again, writes
// "<name> — %%wateredNow%%" into the status paragraph and moves focus to the button now at the
// same place in the list (or the last one, or the heading when the list is empty).
export function mount(root, storage, today) {
  root.innerHTML = MARKUP;
}
