// The contracts of the reading-list feature. Read-only.
export type BookStatus = "toRead" | "reading" | "done";

// The domain record.
export type Book = { readonly id: string; title: string; author: string; pages: number; status: BookStatus };

// What the reading API sends and accepts.
export type ApiBook = { id: string; title: string; author: string; page_count: number; state: "to_read" | "reading" | "finished" };

export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

// The list request as a state machine.
export type ReadingState =
  | { status: "loading" }
  | { status: "ready"; books: Book[] }
  | { status: "failed"; message: string };

export type ReadingAction =
  | { type: "loaded"; books: Book[] }
  | { type: "loadFailed"; message: string }
  | { type: "reloaded" };

// A new book as the form collects it: text from the fields.
export type BookDraft = { title: string; author: string; pages: string };
