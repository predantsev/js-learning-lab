// Another valid solution: shapes built from one list of shared fields, errors collected with filter/map.
export type NoteV1 = { id: string; title: string; text: string; pinned: boolean };
export type NoteV2 = Omit<NoteV1, 'title'> & { heading: string };

export type Shape = Record<string, 'string' | 'number' | 'boolean'>;

const shared: Shape = { id: 'string', text: 'string', pinned: 'boolean' };
export const noteV1Shape: Shape = { id: 'string', title: 'string', text: shared.text, pinned: shared.pinned };
export const noteV2Shape: Shape = { id: 'string', heading: 'string', text: shared.text, pinned: shared.pinned };

export function shapeErrors(value: unknown, shape: Shape): string[] {
  const record = (value ?? {}) as Record<string, unknown>;
  return Object.entries(shape)
    .filter(([field, type]) => typeof record[field] !== type)
    .map(([field, type]) => `${field}: expected ${type}, got ${typeof record[field]}`);
}
