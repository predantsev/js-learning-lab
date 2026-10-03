// The habit screen. Read-only: it uses only RecordsProvider and useRecordsContext.
import { fetchHabits } from "./habits";
import { RecordsProvider, useRecordsContext } from "./RecordsContext";

function HabitCount() {
  const { state } = useRecordsContext();
  const count = state.status === "success" ? state.habits.length : "—";
  return <p data-part="count">%%count%% {count}</p>;
}

function HabitScreen() {
  const { state, dispatch } = useRecordsContext();

  async function load(fail: boolean, action: "started" | "retried") {
    dispatch({ type: action });
    try {
      dispatch({ type: "loaded", habits: await fetchHabits(fail) });
    } catch (error) {
      dispatch({ type: "failed", message: error instanceof Error ? error.message : String(error) });
    }
  }

  return (
    <section>
      <p>
        <button onClick={() => load(false, "started")}>%%load%%</button>{" "}
        <button onClick={() => load(true, "started")}>%%loadFailing%%</button>
      </p>
      {state.status === "loading" && <p role="status">%%loading%%</p>}
      {state.status === "failure" && (
        <div role="alert">
          <p>{state.message}</p>
          <button onClick={() => load(false, "retried")}>%%retry%%</button>
        </div>
      )}
      {state.status === "success" && (
        <ul>
          {state.habits.map((habit) => (
            <li key={habit.id}>{habit.name}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function App() {
  return (
    <RecordsProvider>
      <h2>%%heading%%</h2>
      <HabitCount />
      <HabitScreen />
    </RecordsProvider>
  );
}
