// Synthetic library catalog (read-only): data and validation shared with every client.
export const books = [
  { id: 'b-01', title: "%%book1%%", author: "%%author1%%", available: true },
  { id: 'b-02', title: "%%book2%%", author: "%%author2%%", available: false },
];

export function validateBook(input) {
  const errors = {};
  if (input.title.trim().length === 0) errors.title = 'titleRequired';
  if (input.author.trim().length === 0) errors.author = 'authorRequired';
  return Object.keys(errors).length === 0
    ? { ok: true, value: { title: input.title.trim(), author: input.author.trim(), available: true } }
    : { ok: false, errors };
}

export const MESSAGES = { titleRequired: "%%titleRequired%%", authorRequired: "%%authorRequired%%" };
