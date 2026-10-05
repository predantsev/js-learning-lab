import { useEffect } from "react";
import { useBlocker } from "./router";

// While isDirty is true: navigation inside the app waits for a confirmation,
// and reloading or closing the tab asks the browser to warn first.
// Returns { blocked, proceed, stay }, like useBlocker.
export function useUnsavedChangesGuard(isDirty) {
  const blocker = useBlocker(isDirty);
  useEffect(() => {
    if (!isDirty) return;
    function warn(event) {
      event.preventDefault(); // the browser shows its own "Leave site?" question
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
  return blocker;
}
