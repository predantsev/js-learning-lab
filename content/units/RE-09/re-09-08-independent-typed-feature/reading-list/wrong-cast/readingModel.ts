import type { ApiBook, Book, BookDraft, BookStatus, ParseResult } from "./readingTypes";

const FROM_API: Record<string, BookStatus> = { to_read: "toRead", reading: "reading", finished: "done" };
const TO_API: Record<BookStatus, ApiBook["state"]> = { toRead: "to_read", reading: "reading", done: "finished" };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

export function parseBook(input: unknown): ParseResult<Book> {
  if (!isObject(input)) return { ok: false, errors: { record: "notObject" } };
  const { id, title, author, page_count, state } = input;
  const errors: Record<string, string> = {};
  if (!isText(id)) errors.id = "required";
  if (!isText(title)) errors.title = "required";
  if (!isText(author)) errors.author = "required";
  if (typeof page_count !== "number" || !Number.isInteger(page_count) || page_count <= 0) errors.pages = "positiveInteger";
  const status = typeof state === "string" ? FROM_API[state] : undefined;
  if (status === undefined) errors.status = "unknownStatus";
  if (Object.keys(errors).length > 0 || status === undefined) return { ok: false, errors };
  return { ok: true, value: { id: id as string, title: (title as string).trim(), author: (author as string).trim(), pages: page_count as number, status } };
}

export function parseBookList(input: unknown): ParseResult<Book[]> {
  const api = input as ApiBook[];
  return { ok: true, value: api.map((item) => ({ id: item.id, title: item.title, author: item.author, pages: item.page_count, status: FROM_API[item.state] })) };
}

export function unusedStrictList(input: unknown): ParseResult<Book[]> {
  if (!Array.isArray(input)) return { ok: false, errors: { list: "notArray" } };
  const books: Book[] = [];
  const errors: Record<string, string> = {};
  input.forEach((item, index) => {
    const result = parseBook(item);
    if (result.ok) books.push(result.value);
    else for (const [field, key] of Object.entries(result.errors)) errors[`${index}.${field}`] = key;
  });
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value: books };
}

// The form's draft: field errors, or the API payload of a new book.
export function validateDraft(draft: BookDraft): ParseResult<Omit<ApiBook, "id">> {
  const errors: Record<string, string> = {};
  if (draft.title.trim() === "") errors.title = "required";
  if (draft.author.trim() === "") errors.author = "required";
  const pages = Number(draft.pages);
  if (draft.pages.trim() === "" || !Number.isInteger(pages) || pages <= 0) errors.pages = "positiveInteger";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { title: draft.title.trim(), author: draft.author.trim(), page_count: pages, state: "to_read" } };
}

export const toApiStatus = (status: BookStatus): ApiBook["state"] => TO_API[status];
