import { useEffect, useReducer } from "react";
import { editorReducer, START } from "./editorReducer";
import type { EditorAction } from "./editorReducer";

export default function HabitEditor() {
  const [state, dispatch] = useReducer(editorReducer, START);

  // Every dispatch is printed together with the mode it was sent from.
  function send(action: EditorAction) {
    console.log(`dispatch ${action.type} (mode: ${state.mode})`);
    dispatch(action);
  }

  // Runs only after a commit with a new state: a rejected action leaves no line here.
  useEffect(() => {
    console.log(`→ mode: ${state.mode}`);
  }, [state]);

  return (
    <section>
      <p>
        %%mode%% <strong>{state.mode}</strong>
      </p>
      <ul>
        {state.habits.map((habit) => (
          <li key={habit.id}>
            {habit.name}{" "}
            <button onClick={() => send({ type: "editStarted", id: habit.id })}>%%edit%%</button>
          </li>
        ))}
      </ul>
      {state.mode !== "browsing" && (
        <div>
          <label>
            %%name%% <input value={state.draft} onChange={(event) => send({ type: "draftChanged", text: event.target.value })} />
          </label>
          {state.mode === "saveFailed" && <p role="alert">%%empty%%</p>}
          <button onClick={() => send({ type: "editCanceled" })}>%%cancel%%</button>
        </div>
      )}
      <button onClick={() => send({ type: "saveRequested" })}>%%save%%</button>
    </section>
  );
}
