// Mistake: stops at the first problem, so the client fixes one field, resends, and meets the next one.
const KNOWN = ['title', 'text', 'pinned'];
const fail = (field, key) => ({ ok: false, errors: { [field]: key } });

export function validateNoteInput(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return fail('body', 'notObject');

  if (input.title === undefined) return fail('title', 'required');
  if (typeof input.title !== 'string') return fail('title', 'notString');
  if (input.title.trim() === '') return fail('title', 'required');
  if (input.title.trim().length > 60) return fail('title', 'tooLong');

  if (input.text !== undefined) {
    if (typeof input.text !== 'string') return fail('text', 'notString');
    if (input.text.length > 500) return fail('text', 'tooLong');
  }

  if (input.pinned !== undefined && typeof input.pinned !== 'boolean') return fail('pinned', 'notBoolean');

  for (const key of Object.keys(input)) {
    if (!KNOWN.includes(key)) return fail(key, 'unknownField');
  }

  return { ok: true, value: { title: input.title.trim(), text: input.text ?? '', pinned: input.pinned ?? false } };
}
