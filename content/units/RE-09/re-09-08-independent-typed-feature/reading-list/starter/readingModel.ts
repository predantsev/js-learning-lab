import type { ApiBook, Book, BookDraft, BookStatus, ParseResult } from "./readingTypes";

const FROM_API: Record<string, BookStatus> = { to_read: "toRead", reading: "reading", finished: "done" };
const TO_API: Record<BookStatus, ApiBook["state"]> = { toRead: "to_read", reading: "reading", done: "finished" };

export function parseBook(input: unknown): ParseResult<Book> {
  const api = input as ApiBook;
  return { ok: true, value: { id: api.id, title: api.title, author: api.author, pages: api.page_count, status: FROM_API[api.state] } };
}

export function parseBookList(input: unknown): ParseResult<Book[]> {
  const books = (input as unknown[]).map((item) => (parseBook(item) as { ok: true; value: Book }).value);
  return { ok: true, value: books };
}

export function validateDraft(draft: BookDraft): ParseResult<Omit<ApiBook, "id">> {
  if (draft.title.trim() === "") return { ok: false, errors: { title: "required" } };
  return { ok: true, value: { title: draft.title, author: draft.author, page_count: Number(draft.pages), state: "to_read" } };
}

export const toApiStatus = (status: BookStatus): ApiBook["state"] => TO_API[status];
