import { useEffect, useState } from "react";
import { Router, Routes, Link, Outlet, useParams, createMemoryHistory } from "./router";
import { ErrorBoundary } from "./ErrorBoundary";

const history = createMemoryHistory("/habits/h-01");
const HABITS = [
  { id: "h-01", name: "%%exercise%%" },
  { id: "h-03", name: "%%water%%" },
];

function HabitsLayout() {
  return (
    <div>
      <h1>%%habits%%</h1>
      <ul>
        {HABITS.map((habit) => (
          <li key={habit.id}>
            <Link to={`/habits/${habit.id}`}>{habit.name}</Link>
          </li>
        ))}
      </ul>
      <main>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

function HabitDetail() {
  const { id } = useParams();
  const [breakRender, setBreakRender] = useState(false);
  const [breakEffect, setBreakEffect] = useState(false);
  const habit = HABITS.find((candidate) => candidate.id === id);
  useEffect(() => {
    if (breakEffect) throw new Error("effect");
  }, [breakEffect]);
  if (breakRender) throw new Error("render");

  function markDoneToday() {
    throw new Error("onClick");
  }

  function syncLater() {
    Promise.resolve().then(() => {
      throw new Error("promise");
    });
  }

  return (
    <section>
      <h2>{habit.name}</h2>
      <button onClick={() => setBreakRender(true)}>1. %%throwRender%%</button>{" "}
      <button onClick={() => setBreakEffect(true)}>2. %%throwEffect%%</button>{" "}
      <button onClick={markDoneToday}>3. %%throwClick%%</button>{" "}
      <button onClick={syncLater}>4. %%throwPromise%%</button>
    </section>
  );
}

const routes = [{ path: "/habits", element: <HabitsLayout />, children: [{ path: ":id", element: <HabitDetail /> }] }];

export default function App() {
  return (
    <Router history={history}>
      <Routes routes={routes} />
    </Router>
  );
}
