// The notes schema, checked at the edge of the server.
//   title  — required text, 1–60 characters after trimming
//   text   — optional text, at most 500 characters; default ''
//   pinned — optional boolean; default false
// Returns { ok: true, value } with a parsed note, or { ok: false, errors } with every problem found.
export function validateNoteInput(input) {
  // TODO: check the input against the schema. For now everything is accepted as it came.
  return { ok: true, value: input };
}
