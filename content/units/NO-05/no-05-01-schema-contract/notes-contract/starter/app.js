// The schema contract of the notes store and the loader that applies it.
import { checkField } from './rules.js';

export const storeContract = {
  version: 1,
  fields: {
    id: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1, maxLength: 60 },
    // TODO: body — a string, '' when missing; pinned — a boolean, false when missing
  },
};

// parseStore(json): the stored text → { schemaVersion, records } that follows storeContract,
// or a thrown Error whose `problems` array lists every problem found.
export function parseStore(json) {
  const data = JSON.parse(json);
  return { schemaVersion: data.schemaVersion, records: data.records };
}
