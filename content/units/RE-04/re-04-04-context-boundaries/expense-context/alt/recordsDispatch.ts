import { createContext, useContext } from "react";
import type { Dispatch } from "react";
import type { ExpenseAction } from "./expenses";

type ExpenseDispatch = Dispatch<ExpenseAction>;

export const RecordsDispatchContext = createContext<ExpenseDispatch | null>(null);

export function useRecordsDispatch(): ExpenseDispatch {
  const dispatch = useContext(RecordsDispatchContext);
  if (!dispatch) throw new Error("useRecordsDispatch: no RecordsDispatchContext provider above this component");
  return dispatch;
}
