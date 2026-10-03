import { createContext, useContext } from "react";
import type { Dispatch } from "react";
import type { ExpenseAction } from "./expenses";

// The dispatch function of the expenses reducer, or null when there is no provider above.
export const RecordsDispatchContext = createContext<Dispatch<ExpenseAction> | null>(null);

export function useRecordsDispatch(): Dispatch<ExpenseAction> {
  const dispatch = useContext(RecordsDispatchContext);
  if (dispatch === null) {
    throw new Error("useRecordsDispatch must be used inside <RecordsDispatchContext value={dispatch}>");
  }
  return dispatch;
}
