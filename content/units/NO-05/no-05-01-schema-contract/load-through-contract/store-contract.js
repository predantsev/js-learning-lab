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

// Parses the stored text and checks it against the contract. Collects every problem; returns a new
// store with defaults filled in, or throws an Error whose `problems` lists what is wrong.
export function parseStore(text, contract) {
  const data = JSON.parse(text);
  const problems = [];
  if (data.schemaVersion !== contract.version) {
    problems.push(`schemaVersion: ${data.schemaVersion} is not ${contract.version}`);
  }
  const records = (Array.isArray(data.records) ? data.records : []).map((stored, index) => {
    const record = {};
    for (const key of Object.keys(stored)) {
      if (!(key in contract.fields)) problems.push(`records[${index}].${key}: unknown field`);
    }
    for (const [name, rule] of Object.entries(contract.fields)) {
      if (stored[name] === undefined) {
        if ('default' in rule) record[name] = rule.default;
        else problems.push(`records[${index}].${name}: required`);
        continue;
      }
      const problem = problemOf(rule, stored[name]);
      if (problem) problems.push(`records[${index}].${name}: ${problem}`);
      record[name] = stored[name];
    }
    return record;
  });
  if (problems.length > 0) {
    throw Object.assign(new Error(`the store breaks the contract in ${problems.length} place(s)`), { problems });
  }
  return { schemaVersion: data.schemaVersion, records };
}
