import { lazy, Suspense, useState, useTransition } from "react";
import { Router, Routes, Link, Outlet, createMemoryHistory } from "./router";
import { slowly } from "./slowImport";
import { TaskList } from "./TaskList";
import { TaskCount } from "./TaskCount";

const DueToday = lazy(slowly(() => import("./DueToday")));

export const history = createMemoryHistory("/tasks");

function TaskSearch() {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(event) {
    const value = event.target.value;
    startTransition(() => setText(value));
  }

  return (
    <>
      <Suspense fallback={<p role="status">%%counting%%</p>}>
        <TaskCount />
      </Suspense>
      <label>
        %%search%% <input value={text} onChange={handleChange} />
      </label>
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        <TaskList query={text} />
      </div>
    </>
  );
}

function Layout() {
  return (
    <div>
      <h1>%%planner%%</h1>
      <nav aria-label="%%mainNav%%">
        <Link to="/tasks">%%allTasks%%</Link> · <Link to="/today">%%dueToday%%</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "tasks", element: <TaskSearch /> },
      { path: "today", element: <DueToday /> },
    ],
  },
];

export default function App() {
  return (
    <Suspense fallback={<p role="status">%%loadingPage%%</p>}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </Suspense>
  );
}
