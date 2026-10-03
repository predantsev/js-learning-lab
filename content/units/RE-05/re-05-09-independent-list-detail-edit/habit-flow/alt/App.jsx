import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react";
import { Router, Routes, Link, Outlet, useParams, useNavigate, useLocation, useBlocker, createMemoryHistory } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { loadHabits } from "./habitsApi.js";
import { validateHabit, MESSAGES, FREQUENCY } from "./habits.js";

const HabitsContext = createContext(null);

function statusReducer(status, action) {
  switch (action.type) {
    case "started":
      return { kind: "loading" };
    case "loaded":
      return action.habits.length === 0 ? { kind: "empty" } : { kind: "ready", habits: action.habits };
    case "failed":
      return { kind: "error" };
    case "saved":
      return { kind: "ready", habits: status.habits.map((h) => (h.id === action.id ? { ...h, ...action.changes } : h)) };
    default:
      return status;
  }
}

function useHabits() {
  const [status, dispatch] = useReducer(statusReducer, { kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    loadHabits()
      .then((habits) => current && dispatch({ type: "loaded", habits }))
      .catch(() => current && dispatch({ type: "failed" }));
    return () => {
      current = false;
    };
  }, [attempt]);
  return {
    status,
    retry: () => {
      dispatch({ type: "started" });
      setAttempt((n) => n + 1);
    },
    save: (id, changes) => dispatch({ type: "saved", id, changes }),
  };
}

function useUnsavedGuard(isDirty) {
  useEffect(() => {
    function warn(event) {
      if (isDirty) event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
  return useBlocker(isDirty);
}

function ScreenHeading({ children }) {
  const ref = useRef(null);
  const { path, action } = useLocation();
  useEffect(() => {
    if (action !== "initial" && ref.current) ref.current.focus();
  }, [path, action]);
  return (
    <h1 tabIndex={-1} ref={ref}>
      {children}
    </h1>
  );
}

const STATUS_TEXT = { loading: "%%loading%%", empty: "%%empty%%", error: "%%loadFailed%%" };

function HabitsLayout() {
  const { status, retry, save } = useHabits();
  const habits = status.kind === "ready" ? status.habits : [];
  return (
    <HabitsContext.Provider value={{ habits, save }}>
      <div role="status">{status.kind === "ready" ? `%%count%% ${habits.length}` : STATUS_TEXT[status.kind]}</div>
      {status.kind === "error" ? <button onClick={retry}>%%retry%%</button> : null}
      {habits.length > 0 ? (
        <ul>
          {habits.map((habit) => (
            <li key={habit.id}>
              <Link to={`/habits/${habit.id}`}>{habit.name}</Link>
            </li>
          ))}
        </ul>
      ) : null}
      <main>
        <Outlet />
      </main>
    </HabitsContext.Provider>
  );
}

function useHabit() {
  const { id } = useParams();
  return useContext(HabitsContext).habits.find((habit) => habit.id === id);
}

function Missing() {
  return (
    <>
      <ScreenHeading>%%notFound%%</ScreenHeading>
      <Link to="/habits">%%toList%%</Link>
    </>
  );
}

function HabitDetail() {
  const habit = useHabit();
  if (!habit) return <Missing />;
  return (
    <>
      <ScreenHeading>{habit.name}</ScreenHeading>
      <p>{FREQUENCY[habit.frequency]}</p>
      <Link to={`/habits/${habit.id}/edit`}>%%edit%%</Link>
    </>
  );
}

function EditScreen() {
  const habit = useHabit();
  return habit ? <EditForm key={habit.id} habit={habit} /> : <Missing />;
}

function EditForm({ habit }) {
  const { save } = useContext(HabitsContext);
  const navigate = useNavigate();
  const [name, setName] = useState(habit.name);
  const [frequency, setFrequency] = useState(habit.frequency);
  const [errors, setErrors] = useState(null);
  const nameRef = useRef(null);
  const guard = useUnsavedGuard(name !== habit.name || frequency !== habit.frequency);

  useEffect(() => {
    if (errors?.name) nameRef.current.focus();
  }, [errors]);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const result = validateHabit({ name, frequency });
        if (!result.ok) return setErrors(result.errors);
        save(habit.id, result.value);
        navigate("/habits/" + habit.id, { replace: true, skipGuard: true });
      }}
    >
      <ScreenHeading>%%editing%%</ScreenHeading>
      <label htmlFor="habit-name">%%name%%</label>{" "}
      <input
        id="habit-name"
        ref={nameRef}
        value={name}
        onChange={(event) => setName(event.target.value)}
        {...(errors?.name ? { "aria-invalid": "true", "aria-describedby": "habit-name-error" } : {})}
      />
      {errors?.name ? <span id="habit-name-error"> {MESSAGES[errors.name]}</span> : null}{" "}
      <label htmlFor="habit-frequency">%%frequency%%</label>{" "}
      <select id="habit-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value)}>
        <option value="daily">%%daily%%</option>
        <option value="weekly">%%weekly%%</option>
      </select>{" "}
      <button>%%save%%</button>
      {guard.blocked ? (
        <div role="alertdialog" aria-label="%%unsaved%%">
          <button type="button" autoFocus onClick={guard.stay}>
            %%stay%%
          </button>
          <button type="button" onClick={guard.proceed}>
            %%leave%%
          </button>
        </div>
      ) : null}
    </form>
  );
}

const routes = [
  {
    path: "/habits",
    element: <HabitsLayout />,
    children: [
      { path: "", element: <ScreenHeading>%%habits%%</ScreenHeading> },
      { path: ":id", element: <HabitDetail /> },
      { path: ":id/edit", element: <EditScreen /> },
    ],
  },
  { path: "*", element: <Missing /> },
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
