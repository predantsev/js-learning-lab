import { createContext, useContext, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";
import { recordsReducer } from "./recordsState";
import type { RecordsAction, RecordsState } from "./recordsState";

export type RecordsValue = { state: RecordsState; dispatch: Dispatch<RecordsAction> };

const RecordsContext = createContext<RecordsValue>({} as RecordsValue);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(recordsReducer, { status: "idle" });
  return <RecordsContext value={{ state, dispatch }}>{children}</RecordsContext>;
}

export function useRecordsContext(): RecordsValue {
  return useContext(RecordsContext);
}
