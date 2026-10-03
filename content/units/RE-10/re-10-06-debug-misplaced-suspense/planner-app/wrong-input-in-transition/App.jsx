import { lazy, Suspense, useState, useTransition } from "react";
import { Router, Routes, Link, Outlet, createMemoryHistory } from "./router";
import { slowly } from "./slowImport";
import { TaskList } from "./TaskList";
import { TaskCount } from "./TaskCount";

const DueToday = lazy(slowly(() => import("./DueToday")));

export const history = createMemoryHistory("/tasks");

function TaskSearch() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(event) {
    const value = event.target.value;
    startTransition(() => {
      setText(value);
      setQuery(value);
    });
  }

  return (
    <>
      <TaskCount />
      <label>
        %%search%% <input value={text} onChange={handleChange} />
      </label>
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        <TaskList query={query} />
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
        <Suspense fallback={<p role="status">%%loadingPage%%</p>}>
          <Outlet />
        </Suspense>
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
    <Router history={history}>
      <Routes routes={routes} />
    </Router>
  );
}
