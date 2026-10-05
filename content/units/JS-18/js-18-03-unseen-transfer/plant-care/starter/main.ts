// Starts the plant-care log on the page with the exercise's storage and today's real date.
// Read-only. On the first run it saves a few sample plants, dated relative to today.
import { addDays, todayIso } from "./clock.js";
import { loadPlants, savePlants } from "./storage.js";
import { mount } from "./ui.js";

const today = todayIso();
if (loadPlants(localStorage).length === 0) {
  savePlants(localStorage, [
    { id: "p-1", name: "%%monstera%%", location: "%%livingRoom%%", intervalDays: 7, lastWatered: addDays(today, -7), status: "ok" },
    { id: "p-2", name: "%%fern%%", location: "%%bathroom%%", intervalDays: 3, lastWatered: addDays(today, -1), status: "thirsty" },
    { id: "p-3", name: "%%cactus%%", location: "%%windowsill%%", intervalDays: 21, lastWatered: addDays(today, -30), status: "resting" },
    { id: "p-4", name: "%%basil%%", location: "%%kitchen%%", intervalDays: 2, lastWatered: addDays(today, -3), status: "ok" },
  ]);
}
mount(document.querySelector("#app"), localStorage, today);
