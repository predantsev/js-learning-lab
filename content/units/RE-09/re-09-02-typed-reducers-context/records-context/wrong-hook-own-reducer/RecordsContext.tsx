import { useReducer } from "react";
import type { Dispatch, ReactNode } from "react";
import { recordsReducer } from "./recordsState";
import type { RecordsAction, RecordsState } from "./recordsState";

export type RecordsValue = { state: RecordsState; dispatch: Dispatch<RecordsAction> };

export function RecordsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useRecordsContext(): RecordsValue {
  const [state, dispatch] = useReducer(recordsReducer, { status: "idle" });
  return { state, dispatch };
}
