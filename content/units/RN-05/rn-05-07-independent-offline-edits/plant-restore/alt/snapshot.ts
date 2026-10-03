import type { Plant, PlantErrors } from './models/plant.ts';
import { validatePlant } from './models/plant.ts';

export const KEY = 'jsll.plants.v1';
export const CURRENT_VERSION = 1;
export const MAX_SNAPSHOT_LENGTH = 4000; // characters of JSON text

export type Migration =
  | { ok: true; snapshot: { schemaVersion: number; records: unknown[] } }
  | { ok: false; reason: 'newer' | 'invalid' };

export type RestoreResult =
  | { ok: true; records: Plant[] }
  | { ok: false; reason: 'unparsable' | 'newer' | 'invalid' }
  | { ok: false; reason: 'invalid-record'; index: number; errors: PlantErrors };

export type SaveText = { ok: true; text: string } | { ok: false; reason: 'too-large'; length: number };

// Another approach: a table of steps and a loop, with parseFloat for the old text intervals.
const steps: Record<number, (records: unknown[]) => unknown[]> = {
  0: (records) =>
    records.map((item) => {
      if (typeof item !== 'object' || item === null) return item;
      const plant = { ...(item as Record<string, unknown>) };
      if (typeof plant.everyDays === 'string') plant.everyDays = Number.parseFloat(plant.everyDays);
      if (plant.lastWatered === '') plant.lastWatered = null;
      return plant;
    }),
};

export function migrate(snapshot: unknown): Migration {
  if (typeof snapshot !== 'object' || snapshot === null) return { ok: false, reason: 'invalid' };
  const { schemaVersion, records } = snapshot as Record<string, unknown>;
  if (!Number.isInteger(schemaVersion) || (schemaVersion as number) < 0 || !Array.isArray(records)) {
    return { ok: false, reason: 'invalid' };
  }
  let version = schemaVersion as number;
  if (version > CURRENT_VERSION) return { ok: false, reason: 'newer' };
  let list: unknown[] = records;
  while (version < CURRENT_VERSION) {
    list = steps[version](list);
    version += 1;
  }
  return { ok: true, snapshot: { schemaVersion: version, records: list } };
}

export function restoreSnapshot(raw: string | null): RestoreResult {
  if (raw === null) return { ok: true, records: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'unparsable' };
  }
  const migrated = migrate(parsed);
  if (!migrated.ok) return { ok: false, reason: migrated.reason };
  const results = migrated.snapshot.records.map(validatePlant);
  const index = results.findIndex((result) => !result.ok);
  if (index >= 0) {
    const failed = results[index];
    return { ok: false, reason: 'invalid-record', index, errors: failed.ok ? {} : failed.errors };
  }
  return { ok: true, records: results.map((result) => (result as { value: Plant }).value) };
}

export function prepareSave(records: Plant[]): SaveText {
  const text = JSON.stringify({ schemaVersion: CURRENT_VERSION, records });
  return text.length <= MAX_SNAPSHOT_LENGTH ? { ok: true, text } : { ok: false, reason: 'too-large', length: text.length };
}
