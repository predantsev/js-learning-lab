// A fixture reading API with switches for every scenario. Read-only.
type Stored = { id: string; title: string; author: string; page_count: number; state: string };

const START: Stored[] = [
  { id: "b-01", title: "%%bookSea%%", author: "%%authorSea%%", page_count: 320, state: "reading" },
  { id: "b-02", title: "%%bookGarden%%", author: "%%authorGarden%%", page_count: 180, state: "to_read" },
];

export const server = {
  books: START.map((book) => ({ ...book })),
  failNextList: false, // the next list request rejects
  failNextSave: false, // the next create or status change rejects
  listOverride: null as unknown, // when set, the list request answers with exactly this value
  brokenCovers: [] as string[], // ids whose cover crashes while rendering
  calls: { list: 0, create: 0, status: 0 },
  nextNumber: 3,
};

export function resetServer(): void {
  server.books = START.map((book) => ({ ...book }));
  server.failNextList = false;
  server.failNextSave = false;
  server.listOverride = null;
  server.brokenCovers = [];
  server.calls = { list: 0, create: 0, status: 0 };
  server.nextNumber = 3;
}

const later = <T,>(make: () => T, fail: boolean): Promise<T> =>
  new Promise((resolve, reject) => setTimeout(() => (fail ? reject(new Error("503 Service Unavailable")) : resolve(make())), 20));

const copy = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

// GET /books
export function fetchBooks(): Promise<unknown> {
  server.calls.list += 1;
  const fail = server.failNextList;
  server.failNextList = false;
  return later(() => copy(server.listOverride ?? server.books), fail);
}

// POST /books with { title, author, page_count, state }
export function createBook(payload: unknown): Promise<unknown> {
  server.calls.create += 1;
  const fail = server.failNextSave;
  server.failNextSave = false;
  return later(() => {
    const book = { ...(payload as Omit<Stored, "id">), id: `b-${String(server.nextNumber++).padStart(2, "0")}` };
    server.books.push(book);
    return copy(book);
  }, fail);
}

// PATCH /books/:id with { state }
export function updateStatus(id: string, state: string): Promise<unknown> {
  server.calls.status += 1;
  const fail = server.failNextSave;
  server.failNextSave = false;
  return later(() => {
    server.books = server.books.map((book) => (book.id === id ? { ...book, state } : book));
    return copy(server.books.find((book) => book.id === id));
  }, fail);
}
