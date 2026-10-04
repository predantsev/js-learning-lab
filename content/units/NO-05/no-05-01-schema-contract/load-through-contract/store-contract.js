// The schema contract of the wishlist store: one module that the repository (load and save), the API
// validator and the tests all import. A field without `default` is required; a field that is not
// listed is unknown and rejected.
export const wishContract = {
  version: 1,
  fields: {
    id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1, maxLength: 80 },
    price: { type: 'number', nullable: true, min: 0, default: null },
    acquired: { type: 'boolean', default: false },
    category: { type: 'string', nullable: true, maxLength: 30 },
  },
};

// Returns a problem text, or null when the value follows the rule.
function problemOf(rule, value) {
  if (value === null) return rule.nullable ? null : 'must not be null';
  if (typeof value !== rule.type) return `expected ${rule.type}, got ${typeof value}`;
  if (rule.type === 'string') {
    const length = value.trim().length;
    if (rule.minLength !== undefined && length < rule.minLength) return `shorter than ${rule.minLength}`;
    if (rule.maxLength !== undefined && length > rule.maxLength) return `longer than ${rule.maxLength}`;
  }
  if (rule.type === 'number' && (!Number.isFinite(value) || (rule.min !== undefined && value < rule.min))) {
    return `must be a number of at least ${rule.min}`;
  }
  return null;
}

// Parses the stored text and checks it against the contract. Stops at the FIRST problem and throws an
// Error that names its place; returns a new store with defaults filled in when every rule holds.
export function parseStore(text, contract) {
  const data = JSON.parse(text);
  if (data.schemaVersion !== contract.version) {
    throw new Error(`schemaVersion: ${data.schemaVersion} is not ${contract.version}`);
  }
  if (!Array.isArray(data.records)) throw new Error('records: expected an array'); // never "no records"
  const records = data.records.map((stored, index) => {
    const record = {};
    for (const key of Object.keys(stored)) {
      if (!(key in contract.fields)) throw new Error(`records[${index}].${key}: unknown field`);
    }
    for (const [name, rule] of Object.entries(contract.fields)) {
      if (stored[name] === undefined) {
        if (!('default' in rule)) throw new Error(`records[${index}].${name}: required`);
        record[name] = rule.default;
        continue;
      }
      const problem = problemOf(rule, stored[name]);
      if (problem) throw new Error(`records[${index}].${name}: ${problem}`);
      record[name] = stored[name];
    }
    return record;
  });
  return { schemaVersion: data.schemaVersion, records };
}
