import { useState } from "react";
import { Router, Routes, Link, Outlet, useLocation, createMemoryHistory } from "./router";
import { Fallback } from "./Fallback";
import { HabitDetail } from "./HabitDetail";
import { habits } from "./habits.js";

// A function component cannot catch its children's render errors this way:
// <Outlet /> only describes the child here; the child renders later, outside this try.
function SafeOutlet() {
  try {
    return <Outlet />;
  } catch {
    return <Fallback onReset={() => {}} />;
  }
}

function HabitsLayout() {
  return (
    <div>
      <h1>%%habits%%</h1>
      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>
            <Link to={`/habits/${habit.id}`}>{habit.name}</Link>
          </li>
        ))}
      </ul>
      <main>
        <SafeOutlet />
      </main>
    </div>
  );
}

const routes = [
  {
    path: "/habits",
    element: <HabitsLayout />,
    children: [
      { path: "", element: <p>%%pick%%</p> },
      { path: ":id", element: <HabitDetail /> },
    ],
  },
];

export default function App() {
  const [history] = useState(() => createMemoryHistory("/habits"));
  return (
    <Router history={history}>
      <Routes routes={routes} />
    </Router>
  );
}
