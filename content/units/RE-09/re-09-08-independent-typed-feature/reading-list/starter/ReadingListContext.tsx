import { createContext, useContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import { createBook, fetchBooks, updateStatus } from "./readingServer";
import { parseBook, parseBookList, toApiStatus } from "./readingModel";
import { readingReducer } from "./readingReducer";
import type { ApiBook, BookStatus, ReadingState } from "./readingTypes";

export type ReadingListValue = {
  state: ReadingState;
  reload: () => void;
  addBook: (payload: Omit<ApiBook, "id">) => Promise<string | null>;
  setStatus: (id: string, status: BookStatus) => Promise<string | null>;
};

const ReadingListContext = createContext({} as ReadingListValue);

export function ReadingListProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(readingReducer, { status: "loading" });

  useEffect(() => {
    fetchBooks()
      .then((body) => {
        const result = parseBookList(body);
        if (result.ok) dispatch({ type: "loaded", books: result.value });
      })
      .catch(() => dispatch({ type: "loadFailed", message: "listFailed" }));
  }, []);

  const value: ReadingListValue = {
    state,
    reload() {
      dispatch({ type: "reloaded" });
      fetchBooks().then((body) => {
        const result = parseBookList(body);
        if (result.ok) dispatch({ type: "loaded", books: result.value });
      });
    },
    async addBook(payload) {
      const result = parseBook(await createBook(payload));
      if (result.ok && state.status === "ready") dispatch({ type: "loaded", books: [...state.books, result.value] });
      return null;
    },
    async setStatus(id, status) {
      await updateStatus(id, toApiStatus(status));
      return null;
    },
  };
  return <ReadingListContext value={value}>{children}</ReadingListContext>;
}

export function useReadingList(): ReadingListValue {
  return useContext(ReadingListContext);
}
