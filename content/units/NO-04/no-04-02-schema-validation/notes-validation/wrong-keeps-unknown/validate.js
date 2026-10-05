// Misconception: unknown fields do no harm, so they are not checked (they are still left out of value).
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


  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { title: input.title.trim(), text: input.text ?? '', pinned: input.pinned ?? false } };
}
