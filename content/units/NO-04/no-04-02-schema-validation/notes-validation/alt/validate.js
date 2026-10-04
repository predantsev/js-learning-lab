// Another valid solution: one rule function per field, each returning an error key or null.
const rules = {
  title(value) {
    if (value === undefined) return 'required';
    if (typeof value !== 'string') return 'notString';
    const trimmed = value.trim();
    if (trimmed.length === 0) return 'required';
    return trimmed.length > 60 ? 'tooLong' : null;
  },
  text(value) {
    if (value === undefined) return null;
    if (typeof value !== 'string') return 'notString';
    return value.length > 500 ? 'tooLong' : null;
  },
  pinned(value) {
    return value === undefined || typeof value === 'boolean' ? null : 'notBoolean';
  },
};

export function validateNoteInput(input) {
  const isPlainObject = input !== null && typeof input === 'object' && !Array.isArray(input);
  if (!isPlainObject) return { ok: false, errors: { body: 'notObject' } };

  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const problem = rule(input[field]);
    if (problem !== null) errors[field] = problem;
  }
  for (const key of Object.keys(input)) {
    if (!(key in rules)) errors[key] = 'unknownField';
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const { title, text = '', pinned = false } = input;
  return { ok: true, value: { title: title.trim(), text, pinned } };
}
