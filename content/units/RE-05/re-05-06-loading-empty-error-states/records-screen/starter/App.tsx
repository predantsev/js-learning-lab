import { useState } from "react";
import { setNextOutcome, type Outcome } from "./tasksApi";
import { RecordsScreen } from "./RecordsScreen";

export default function App() {
  const [next, setNext] = useState<Outcome>("ok");
  const [creating, setCreating] = useState(false);
  function choose(outcome: Outcome) {
    setNextOutcome(outcome);
    setNext(outcome);
  }
  return (
    <>
      <fieldset>
        <legend>%%nextLoad%%</legend>
        {(["ok", "empty", "fail"] as const).map((outcome) => (
          <label key={outcome}>
            <input type="radio" name="next" checked={next === outcome} onChange={() => choose(outcome)} /> {outcome}{" "}
          </label>
        ))}
      </fieldset>
      <h1>%%planner%%</h1>
      {creating ? <p>%%createForm%%</p> : <RecordsScreen onCreate={() => setCreating(true)} />}
    </>
  );
}
