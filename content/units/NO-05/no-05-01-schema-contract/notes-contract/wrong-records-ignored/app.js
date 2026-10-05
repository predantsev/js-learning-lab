// The schema contract of the notes store and the loader that applies it.
// Mistake: when records is not an array, it silently loads an empty store.
import { checkField } from './rules.js';

export const storeContract = {
  version: 1,
  fields: {
    id: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1, maxLength: 60 },
    body: { type: 'string', default: '' },
    pinned: { type: 'boolean', default: false },
  },
};

// parseStore(json): the stored text → { schemaVersion, records } that follows storeContract,
// or a thrown Error whose `problems` array lists every problem found.
export function parseStore(json) {
  const data = JSON.parse(json);
  const problems = [];
  if (data.schemaVersion !== storeContract.version) {
    problems.push(`schemaVersion: expected ${storeContract.version}, got ${data.schemaVersion}`);
  }
  const seen = new Set();
  const records = (Array.isArray(data.records) ? data.records : []).map((stored, index) => {
    const record = {};
    for (const key of Object.keys(stored)) {
      if (!Object.hasOwn(storeContract.fields, key)) problems.push(`records[${index}].${key}: unknown field`);
    }
    for (const [name, rule] of Object.entries(storeContract.fields)) {
      const value = stored[name];
      if (value === undefined) {
        if (Object.hasOwn(rule, 'default')) record[name] = rule.default;
        else problems.push(`records[${index}].${name}: required`);
        continue;
      }
      const problem = checkField(rule, value);
      if (problem) problems.push(`records[${index}].${name}: ${problem}`);
      record[name] = value;
    }
    if (seen.has(stored.id)) problems.push(`records[${index}].id: duplicate ${stored.id}`);
    seen.add(stored.id);
    return record;
  });
  if (problems.length > 0) {
    throw Object.assign(new Error(`${problems.length} problem(s) in the stored notes`), { problems });
  }
  return { schemaVersion: data.schemaVersion, records };
}
