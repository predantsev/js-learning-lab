import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Router, Routes, Link, Outlet, useParams, useNavigate, useLocation, useBlocker, createMemoryHistory } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { loadHabits } from "./habitsApi.js";
import { validateHabit, MESSAGES, FREQUENCY } from "./habits.js";

const HabitsContext = createContext(null);

// After every route change except the first load: focus the screen's heading.
function useHeadingFocus() {
  const headingRef = useRef(null);
  const { path, action } = useLocation();
  useEffect(() => {
    if (action !== "initial") headingRef.current?.focus();
  }, [path, action]);
  return headingRef;
}

function statusMessage(status) {
  switch (status.kind) {
    case "loading":
      return "%%loading%%";
    case "empty":
      return "%%empty%%";
    case "error":
      return "%%loadFailed%%";
    case "ready":
      return `%%count%% ${status.habits.length}`;
  }
}

function HabitsLayout() {
  const [status, setStatus] = useState({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    loadHabits().then(
      (habits) => !ignore && setStatus(habits.length === 0 ? { kind: "empty" } : { kind: "ready", habits }),
      () => !ignore && setStatus({ kind: "error" }),
    );
    return () => {
      ignore = true;
    };
  }, [attempt]);

  function retry() {
    setStatus({ kind: "loading" });
    setAttempt(attempt + 1);
  }

  function saveHabit(id, changes) {
    setStatus({ kind: "ready", habits: status.habits.map((habit) => (habit.id === id ? { ...habit, ...changes } : habit)) });
  }

  const habits = status.kind === "ready" ? status.habits : [];
  return (
    <HabitsContext.Provider value={{ habits, saveHabit }}>
      <p role="status">{statusMessage(status)}</p>
      {status.kind === "error" && <button onClick={retry}>%%retry%%</button>}
      {status.kind === "ready" && (
        <ul>
          {habits.map((habit) => (
            <li key={habit.id}>
              <Link to={`/habits/${habit.id}`}>{habit.name}</Link>
            </li>
          ))}
        </ul>
      )}
      <main>
        <Outlet />
      </main>
    </HabitsContext.Provider>
  );
}

function HabitsHome() {
  const headingRef = useHeadingFocus();
  return (
    <h1 tabIndex={-1} ref={headingRef}>
      %%habits%%
    </h1>
  );
}

function NotFound() {
  const headingRef = useHeadingFocus();
  return (
    <section>
      <h1 tabIndex={-1} ref={headingRef}>
        %%notFound%%
      </h1>
      <Link to="/habits">%%toList%%</Link>
    </section>
  );
}

function HabitDetail() {
  const { id } = useParams();
  const { habits } = useContext(HabitsContext);
  const habit = habits.find((candidate) => candidate.id === id);
  const headingRef = useHeadingFocus();
  if (habit === undefined) return <NotFound />;
  return (
    <section>
      <h1 tabIndex={-1} ref={headingRef}>
        {habit.name}
      </h1>
      <p>{FREQUENCY[habit.frequency]}</p>
      <Link to={`/habits/${id}/edit`}>%%edit%%</Link>
    </section>
  );
}

function HabitEditRoute() {
  const { id } = useParams();
  const { habits } = useContext(HabitsContext);
  const habit = habits.find((candidate) => candidate.id === id);
  if (habit === undefined) return <NotFound />;
  return <HabitEdit key={id} habit={habit} />;
}

function HabitEdit({ habit }) {
  const { saveHabit } = useContext(HabitsContext);
  const navigate = useNavigate();
  const headingRef = useHeadingFocus();
  const nameRef = useRef(null);
  const [draft, setDraft] = useState({ name: habit.name, frequency: habit.frequency });
  const [errors, setErrors] = useState({});
  const [failedSubmits, setFailedSubmits] = useState(0);
  const isDirty = draft.name !== habit.name || draft.frequency !== habit.frequency;
  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  useEffect(() => {
    if (failedSubmits > 0) nameRef.current.focus();
  }, [failedSubmits]);

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateHabit(draft);
    if (!result.ok) {
      setErrors(result.errors);
      setFailedSubmits(failedSubmits + 1);
      return;
    }
    saveHabit(habit.id, result.value);
    navigate(`/habits/${habit.id}`, { replace: true, skipGuard: true });
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <h1 tabIndex={-1} ref={headingRef}>
        %%editing%%
      </h1>
      <p>
        <label htmlFor="habit-name">%%name%%</label>{" "}
        <input
          id="habit-name"
          ref={nameRef}
          value={draft.name}
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={errors.name ? "habit-name-error" : undefined}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </p>
      {errors.name && <p id="habit-name-error">{MESSAGES[errors.name]}</p>}
      <p>
        <label htmlFor="habit-frequency">%%frequency%%</label>{" "}
        <select id="habit-frequency" value={draft.frequency} onChange={(event) => setDraft({ ...draft, frequency: event.target.value })}>
          <option value="daily">%%daily%%</option>
          <option value="weekly">%%weekly%%</option>
        </select>
      </p>
      <button>%%save%%</button>
      {blocker.blocked && <LeaveDialog onStay={blocker.stay} onLeave={blocker.proceed} />}
    </form>
  );
}

// The in-page question while a navigation waits: Stay gets focus, and after Stay focus goes back to the opener.
function LeaveDialog({ onStay, onLeave }) {
  const stayRef = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    stayRef.current.focus();
    return () => opener.focus();
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

const routes = [
  {
    path: "/habits",
    element: <HabitsLayout />,
    children: [
      { path: "", element: <HabitsHome /> },
      { path: ":id", element: <HabitDetail /> },
      { path: ":id/edit", element: <HabitEditRoute /> },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export default function App({ initialPath = "/habits" }) {
  const [history] = useState(() => createMemoryHistory(initialPath));
  return (
    <Router history={history}>
      <HistoryPanel />
      <Routes routes={routes} />
    </Router>
  );
}
