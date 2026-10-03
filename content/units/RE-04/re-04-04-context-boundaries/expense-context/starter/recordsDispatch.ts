import { createContext } from "react";
import type { Dispatch } from "react";
import type { ExpenseAction } from "./expenses";

// TODO: type this context: its value is the dispatch function of the expenses reducer,
// or null when there is no provider above.
export const RecordsDispatchContext = createContext(null);

// TODO: return the dispatch function from RecordsDispatchContext.
// Outside a provider, throw an error that names this hook.
export function useRecordsDispatch(): Dispatch<ExpenseAction> {
  throw new Error("TODO: useRecordsDispatch is not written yet");
}
