import { test, expect } from "./testing.js";
import { dueToday, isDue, parsePlants, waterPlants } from "./plants.js";
import { loadPlants, savePlants, STORAGE_KEY } from "./storage.js";
import { mount } from "./ui.js";

// Your tests. Start each test name with its level: "unit: …", "integration: …" or "user: …".
