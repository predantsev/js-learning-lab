// Mistake: checks everything but hands on the raw input instead of the parsed value.
//   title  — required text, 1–60 characters after trimming
//   text   — optional text, at most 500 characters; default ''
//   pinned — optional boolean; default false
// Returns { ok: true, value } with a parsed note, or { ok: false, errors } with every problem found.
const KNOWN = ['title', 'text', 'pinned'];

export function validateNoteInput(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: { body: 'notObject' } };
  }
  const errors = {};

  if (input.title === undefined) errors.title = 'required';
  else if (typeof input.title !== 'string') errors.title = 'notString';
  else if (input.title.trim() === '') errors.title = 'required';
  else if (input.title.trim().length > 60) errors.title = 'tooLong';

  if (input.text !== undefined) {
    if (typeof input.text !== 'string') errors.text = 'notString';
    else if (input.text.length > 500) errors.text = 'tooLong';
  }

  if (input.pinned !== undefined && typeof input.pinned !== 'boolean') errors.pinned = 'notBoolean';

  for (const key of Object.keys(input)) {
    if (!KNOWN.includes(key)) errors[key] = 'unknownField';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: input }; // the raw body: untrimmed, without defaults
}
