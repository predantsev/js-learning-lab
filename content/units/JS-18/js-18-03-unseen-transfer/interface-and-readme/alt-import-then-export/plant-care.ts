// The plant-care feature's public interface: the only module the rest of the app imports.
import { parsePlants, dueToday, waterPlants } from "./plants.js";
import { loadPlants, savePlants } from "./storage.js";
import { mount } from "./ui.js";

export type { Plant, PlantStatus } from "./plants.js";
export { parsePlants, dueToday, waterPlants, loadPlants, savePlants, mount };
