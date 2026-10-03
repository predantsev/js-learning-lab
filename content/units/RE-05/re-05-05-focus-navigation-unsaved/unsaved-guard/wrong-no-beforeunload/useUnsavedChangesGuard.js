import { useBlocker } from "./router";

// While isDirty is true: navigation inside the app waits for a confirmation,
// and reloading or closing the tab asks the browser to warn first.
// Returns { blocked, proceed, stay }, like useBlocker.
export function useUnsavedChangesGuard(isDirty) {
  return useBlocker(isDirty);
}
