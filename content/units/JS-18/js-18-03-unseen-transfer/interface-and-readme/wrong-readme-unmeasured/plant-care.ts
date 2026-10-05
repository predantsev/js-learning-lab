// The plant-care feature's public interface: the only module the rest of the app imports.
export type { Plant, PlantStatus } from "./plants.js";
export { parsePlants, dueToday, waterPlants } from "./plants.js";
export { loadPlants, savePlants } from "./storage.js";
export { mount } from "./ui.js";
