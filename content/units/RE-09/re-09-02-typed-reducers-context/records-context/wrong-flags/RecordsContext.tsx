import { createContext, useContext, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";
import { recordsReducer } from "./recordsState";
import type { RecordsAction, RecordsState } from "./recordsState";

export type RecordsValue = { state: RecordsState; dispatch: Dispatch<RecordsAction> };

// null means "no provider above": the hook turns that into a clear error.
const RecordsContext = createContext<RecordsValue | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(recordsReducer, { isLoading: false, error: null, habits: null });
  return <RecordsContext value={{ state, dispatch }}>{children}</RecordsContext>;
}

export function useRecordsContext(): RecordsValue {
  const value = useContext(RecordsContext);
  if (value === null) {
    throw new Error("useRecordsContext must be used inside <RecordsProvider>");
  }
  return value;
}
