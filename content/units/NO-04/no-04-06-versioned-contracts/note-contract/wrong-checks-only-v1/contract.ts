// The contract of the notes API: what each version promises its clients.
// The types are for tsc; the shapes are the same promise as data, so a check can use it at runtime.

export type NoteV1 = { id: string; title: string; text: string; pinned: boolean };
export type NoteV2 = { id: string; heading: string; text: string; pinned: boolean };

// A shape: field name → the typeof the value must have.
export type Shape = Record<string, 'string' | 'number' | 'boolean'>;

export const noteV1Shape: Shape = { id: 'string', title: 'string', text: 'string', pinned: 'boolean' };
export const noteV2Shape: Shape = { id: 'string', heading: 'string', text: 'string', pinned: 'boolean' };

// One message per broken promise, for example "title: expected string". Extra fields are fine.
export function shapeErrors(value: unknown, shape: Shape): string[] {
  if (typeof value !== 'object' || value === null) return ['body: expected object'];
  const record = value as Record<string, unknown>;
  const errors: string[] = [];
  for (const [field, type] of Object.entries(shape)) {
    if (typeof record[field] !== type) errors.push(`${field}: expected ${type}`);
  }
  return errors;
}
