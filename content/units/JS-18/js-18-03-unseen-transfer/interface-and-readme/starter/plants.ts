// The plant-care model, as you built it in the previous task: only the signatures are kept here.
// Read-only. The bodies are left out: this task is about the module's interface, not its code.

export type PlantStatus = "ok" | "thirsty" | "resting";

export type Plant = {
  id: string;
  name: string;
  location: string;
  intervalDays: number;
  lastWatered: string;
  status: PlantStatus;
};

const NOT_HERE = "the body of this function is not part of this task";

export function parsePlants(input: unknown): Plant[] {
  throw new Error(NOT_HERE);
}

export function isDue(plant: Plant, today: string): boolean {
  throw new Error(NOT_HERE);
}

export function dueToday(plants: Plant[], today: string): Plant[] {
  throw new Error(NOT_HERE);
}

export function waterPlants(plants: Plant[], ids: string[], today: string): Plant[] {
  throw new Error(NOT_HERE);
}
