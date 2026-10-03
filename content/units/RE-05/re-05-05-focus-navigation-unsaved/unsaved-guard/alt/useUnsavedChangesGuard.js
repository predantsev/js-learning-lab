import { useEffect } from "react";
import { useBlocker } from "./router";

// While isDirty is true: navigation inside the app waits for a confirmation,
// and reloading or closing the tab asks the browser to warn first.
// Returns { blocked, proceed, stay }, like useBlocker.
export function useUnsavedChangesGuard(isDirty) {
  useEffect(() => {
    const warnIfDirty = (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warnIfDirty);
    return () => {
      window.removeEventListener("beforeunload", warnIfDirty);
    };
  }, [isDirty]);
  const { blocked, proceed, stay } = useBlocker(isDirty);
  return { blocked, proceed, stay };
}
