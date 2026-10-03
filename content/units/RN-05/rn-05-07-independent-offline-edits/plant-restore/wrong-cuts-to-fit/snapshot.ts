import type { Plant, PlantErrors } from './models/plant.ts';
import { validatePlant } from './models/plant.ts';

// Mistake: drops plants from the end until the text fits the limit.
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

// v0 → v1: everyDays was text ("3"), and a plant never watered had lastWatered: ''.
function v0ToV1(item: unknown): unknown {
  if (typeof item !== 'object' || item === null) return item;
  const { everyDays, lastWatered, ...rest } = item as Record<string, unknown>;
  return {
    ...rest,
    everyDays: typeof everyDays === 'string' ? Number(everyDays) : everyDays,
    lastWatered: lastWatered === '' ? null : lastWatered,
  };
}

export function migrate(snapshot: unknown): Migration {
  const s = snapshot as { schemaVersion?: unknown; records?: unknown } | null;
  if (typeof s?.schemaVersion !== 'number' || !Number.isInteger(s.schemaVersion) || s.schemaVersion < 0 || !Array.isArray(s.records)) {
    return { ok: false, reason: 'invalid' };
  }
  if (s.schemaVersion > CURRENT_VERSION) return { ok: false, reason: 'newer' };
  const records = s.schemaVersion === 0 ? s.records.map(v0ToV1) : s.records;
  return { ok: true, snapshot: { schemaVersion: CURRENT_VERSION, records } };
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
  if (!migrated.ok) return migrated;
  const records: Plant[] = [];
  for (const [index, item] of migrated.snapshot.records.entries()) {
    const result = validatePlant(item);
    if (!result.ok) return { ok: false, reason: 'invalid-record', index, errors: result.errors };
    records.push(result.value);
  }
  return { ok: true, records };
}

export function prepareSave(records: Plant[]): SaveText {
  let kept = records;
  let text = JSON.stringify({ schemaVersion: CURRENT_VERSION, records: kept });
  while (text.length > MAX_SNAPSHOT_LENGTH && kept.length > 0) {
    kept = kept.slice(0, -1);
    text = JSON.stringify({ schemaVersion: CURRENT_VERSION, records: kept });
  }
  return { ok: true, text };
}
