import { useEffect, useRef } from "react";

// The in-page question shown while a navigation waits: Stay is focused first.
export function LeaveDialog({ onStay, onLeave }) {
  const stayRef = useRef(null);
  useEffect(() => {
    const opener = document.activeElement; // the control that started the navigation
    stayRef.current.focus();
    return () => opener.focus(); // after Stay, focus goes back there instead of falling to body
  }, []);
  return (
    <div role="alertdialog" aria-labelledby="leave-text">
      <p id="leave-text">%%unsaved%%</p>
      <button type="button" ref={stayRef} onClick={onStay}>
        %%stay%%
      </button>{" "}
      <button type="button" onClick={onLeave}>
        %%leave%%
      </button>
    </div>
  );
}
