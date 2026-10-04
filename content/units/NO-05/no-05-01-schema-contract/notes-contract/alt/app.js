// Another valid shape: one function checks a record and returns its problems; the loader joins them.
import { checkField } from './rules.js';

export const storeContract = {
  version: 1,
  fields: {
    id: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1, maxLength: 60 },
    pinned: { type: 'boolean', default: false },
    body: { type: 'string', default: '' },
  },
};

function checkRecord(stored, at) {
  const problems = [];
  const record = {};
  for (const key in stored) {
    if (!(key in storeContract.fields)) problems.push(`${at}.${key}: unknown field`);
  }
  for (const name in storeContract.fields) {
    const rule = storeContract.fields[name];
    if (!(name in stored)) {
      if ('default' in rule) record[name] = rule.default;
      else problems.push(`${at}.${name}: required`);
    } else {
      const problem = checkField(rule, stored[name]);
      if (problem !== null) problems.push(`${at}.${name}: ${problem}`);
      record[name] = stored[name];
    }
  }
  return { record, problems };
}

export function parseStore(json) {
  const data = JSON.parse(json);
  const problems = [];
  if (data.schemaVersion !== 1) problems.push(`schemaVersion ${data.schemaVersion} is not supported`);
  const stored = data.records;
  if (!Array.isArray(stored)) problems.push('records is not an array');
  const records = [];
  const ids = [];
  for (let i = 0; Array.isArray(stored) && i < stored.length; i += 1) {
    const checked = checkRecord(stored[i], `records[${i}]`);
    problems.push(...checked.problems);
    if (ids.includes(stored[i].id)) problems.push(`records[${i}].id is a duplicate`);
    ids.push(stored[i].id);
    records.push(checked.record);
  }
  if (problems.length) {
    const error = new Error('stored notes do not match the contract');
    error.problems = problems;
    throw error;
  }
  return { schemaVersion: 1, records };
}
