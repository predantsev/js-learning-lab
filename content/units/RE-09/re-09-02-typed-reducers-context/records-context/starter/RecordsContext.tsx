import type { Dispatch, ReactNode } from "react";
import type { RecordsAction, RecordsState } from "./recordsState";

export type RecordsValue = { state: RecordsState; dispatch: Dispatch<RecordsAction> };

// TODO: a context for RecordsValue that has no value outside a provider.

// TODO: RecordsProvider owns the reducer (initial state: idle) and gives { state, dispatch } to its children.
export function RecordsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// TODO: return the value of the nearest provider; outside a provider throw an Error whose message names this hook.
export function useRecordsContext(): RecordsValue {
  return { state: { status: "idle" }, dispatch: () => {} };
}
