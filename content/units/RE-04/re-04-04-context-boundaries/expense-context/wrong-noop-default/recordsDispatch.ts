import { createContext, useContext } from "react";
import type { Dispatch } from "react";
import type { ExpenseAction } from "./expenses";

// A harmless default, "so that nothing crashes".
export const RecordsDispatchContext = createContext<Dispatch<ExpenseAction>>(() => {});

export function useRecordsDispatch(): Dispatch<ExpenseAction> {
  return useContext(RecordsDispatchContext);
}
