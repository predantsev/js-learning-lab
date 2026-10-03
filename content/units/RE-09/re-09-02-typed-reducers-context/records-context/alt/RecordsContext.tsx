import { createContext, useContext, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";
import { recordsReducer } from "./recordsState";
import type { RecordsAction, RecordsState } from "./recordsState";

export type RecordsValue = { state: RecordsState; dispatch: Dispatch<RecordsAction> };

const RecordsContext = createContext<RecordsValue | undefined>(undefined);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(recordsReducer, { status: "idle" });
  const value: RecordsValue = { state, dispatch };
  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecordsContext(): RecordsValue {
  const value = useContext(RecordsContext);
  if (!value) throw new Error("useRecordsContext() was called outside <RecordsProvider>.");
  return value;
}
