import { useEffect, useRef } from "react";

// The in-page question shown while a navigation waits: Stay is focused first.
export function LeaveDialog({ onStay, onLeave }) {
  const stayRef = useRef(null);
  useEffect(() => stayRef.current.focus(), []);
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
