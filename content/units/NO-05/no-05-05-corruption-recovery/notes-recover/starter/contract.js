// The notes contract (version 1): parseStore(text) returns { schemaVersion, records } or throws an
// Error whose `problems` lists what breaks the contract. JSON.parse errors are thrown as they are.
const FIELDS = ['id', 'title', 'body', 'pinned'];

export function parseStore(text) {
  const data = JSON.parse(text);
  const problems = [];
  if (data?.schemaVersion !== 1) problems.push(`schemaVersion: expected 1, got ${data?.schemaVersion}`);
  if (!Array.isArray(data?.records)) problems.push('records: expected an array');
  const ids = new Set();
  (Array.isArray(data?.records) ? data.records : []).forEach((note, i) => {
    if (typeof note.id !== 'string' || note.id === '') problems.push(`records[${i}].id: expected a non-empty string`);
    else if (ids.has(note.id)) problems.push(`records[${i}].id: duplicate ${note.id}`);
    ids.add(note.id);
    if (typeof note.title !== 'string' || note.title.trim() === '') problems.push(`records[${i}].title: expected a non-empty string`);
    if (note.body !== undefined && typeof note.body !== 'string') problems.push(`records[${i}].body: expected a string`);
    if (note.pinned !== undefined && typeof note.pinned !== 'boolean') problems.push(`records[${i}].pinned: expected a boolean`);
    for (const key of Object.keys(note)) if (!FIELDS.includes(key)) problems.push(`records[${i}].${key}: unknown field`);
  });
  if (problems.length > 0) throw Object.assign(new Error('the notes store breaks the contract'), { problems });
  return data;
}
