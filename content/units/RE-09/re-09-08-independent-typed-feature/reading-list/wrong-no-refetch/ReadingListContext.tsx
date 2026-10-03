import { createContext, useContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import { createBook, fetchBooks, updateStatus } from "./readingServer";
import { parseBook, parseBookList, toApiStatus } from "./readingModel";
import { readingReducer } from "./readingReducer";
import type { ApiBook, BookStatus, ReadingState } from "./readingTypes";

// What the feature's components can do. A write resolves to null on success or to an error key.
export type ReadingListValue = {
  state: ReadingState;
  reload: () => void;
  addBook: (payload: Omit<ApiBook, "id">) => Promise<string | null>;
  setStatus: (id: string, status: BookStatus) => Promise<string | null>;
};

const ReadingListContext = createContext<ReadingListValue | null>(null);

export function ReadingListProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(readingReducer, { status: "loading" });

  // Fetches the list and puts it into the reducer; every write ends with this (invalidation).
  async function refresh() {
    try {
      const result = parseBookList(await fetchBooks());
      if (result.ok) dispatch({ type: "loaded", books: result.value });
      else dispatch({ type: "loadFailed", message: "badResponse" });
    } catch {
      dispatch({ type: "loadFailed", message: "listFailed" });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // Puts the server's answer into the current list instead of asking for the list again.
  async function write(request: () => Promise<unknown>): Promise<string | null> {
    try {
      const answer = parseBook(await request());
      if (!answer.ok) return "badResponse";
      if (state.status === "ready") {
        const others = state.books.filter((book) => book.id !== answer.value.id);
        dispatch({ type: "loaded", books: [...others, answer.value] });
      }
    } catch {
      return "saveFailed";
    }
    return null;
  }

  const value: ReadingListValue = {
    state,
    reload() {
      dispatch({ type: "reloaded" });
      refresh();
    },
    addBook: (payload) => write(() => createBook(payload)),
    setStatus: (id, status) => write(() => updateStatus(id, toApiStatus(status))),
  };
  return <ReadingListContext value={value}>{children}</ReadingListContext>;
}

export function useReadingList(): ReadingListValue {
  const value = useContext(ReadingListContext);
  if (value === null) throw new Error("useReadingList must be used inside <ReadingListProvider>");
  return value;
}
