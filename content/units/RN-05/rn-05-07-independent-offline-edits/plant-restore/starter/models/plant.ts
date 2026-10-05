// models/plant.ts: the shared plant model (read-only) — used by the web client, native/ and fixtures.
export type Plant = {
  id: string;
  name: string; // 1–40 characters after trimming
  everyDays: number; // whole days between waterings, 1–60
  lastWatered: string | null; // 'YYYY-MM-DD', or null if never watered
};

export type PlantErrors = Partial<Record<keyof Plant, string>>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validatePlant(input: unknown): { ok: true; value: Plant } | { ok: false; errors: PlantErrors } {
  if (typeof input !== 'object' || input === null) return { ok: false, errors: { id: 'required' } };
  const raw = input as Record<string, unknown>;
  const errors: PlantErrors = {};
  if (typeof raw.id !== 'string' || raw.id === '') errors.id = 'required';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (name === '') errors.name = 'required';
  else if (name.length > 40) errors.name = 'tooLong';
  const everyDays = raw.everyDays;
  if (typeof everyDays !== 'number' || !Number.isInteger(everyDays) || everyDays < 1 || everyDays > 60) {
    errors.everyDays = 'invalid';
  }
  const lastWatered = raw.lastWatered;
  if (lastWatered !== null && !(typeof lastWatered === 'string' && DATE.test(lastWatered))) errors.lastWatered = 'invalid';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { id: raw.id as string, name, everyDays: everyDays as number, lastWatered: lastWatered as string | null } };
}
