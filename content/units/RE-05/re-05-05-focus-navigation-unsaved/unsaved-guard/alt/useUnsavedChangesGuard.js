import { useEffect } from "react";
import { useBlocker } from "./router";

// Asks the browser to warn before a reload or tab close, only while `when` is true.
function useBeforeUnloadWarning(when) {
  useEffect(() => {
    if (!when) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = ""; // the older way some browsers still expect
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [when]);
}

// While isDirty is true: navigation inside the app waits for a confirmation,
// and reloading or closing the tab asks the browser to warn first.
// Returns { blocked, proceed, stay }, like useBlocker.
export function useUnsavedChangesGuard(isDirty) {
  useBeforeUnloadWarning(isDirty);
  return useBlocker(isDirty);
}
