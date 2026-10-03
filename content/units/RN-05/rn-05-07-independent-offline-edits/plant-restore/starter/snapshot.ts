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

export function migrate(snapshot: unknown): Migration {
  // TODO
  return { ok: false, reason: 'invalid' };
}

export function restoreSnapshot(raw: string | null): RestoreResult {
  // TODO
  return { ok: false, reason: 'invalid' };
}

export function prepareSave(records: Plant[]): SaveText {
  // TODO
  return { ok: false, reason: 'too-large', length: 0 };
}
