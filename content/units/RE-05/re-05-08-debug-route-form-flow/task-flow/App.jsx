import { createContext, useContext, useState } from "react";
import { Router, Routes, Link, Outlet, useParams, useNavigate, createMemoryHistory } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { FocusReport } from "./FocusReport";
import { INITIAL_TASKS } from "./tasks.js";

const history = createMemoryHistory("/tasks");
const TasksContext = createContext(null);

function TasksLayout() {
  const { tasks } = useContext(TasksContext);
  return (
    <div>
      <HistoryPanel />
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <Link to={`/tasks/${task.id}`}>{task.title}</Link>
          </li>
        ))}
      </ul>
      <main>
        <Outlet />
      </main>
      <FocusReport />
    </div>
  );
}

function TaskDetail() {
  const { id } = useParams();
  const { tasks } = useContext(TasksContext);
  const task = tasks.find((candidate) => candidate.id === id);
  if (task === undefined) return <h1>%%notFound%%</h1>;
  return (
    <section>
      <h1>{task.title}</h1>
      <p>%%due%% {task.dueDate}</p>
      <Link to={`/tasks/${id}/edit`}>%%edit%%</Link>
    </section>
  );
}

function TaskEditRoute() {
  const { id } = useParams();
  return <TaskEdit key={id} id={id} />;
}

function TaskEdit({ id }) {
  const { tasks, setTasks } = useContext(TasksContext);
  const navigate = useNavigate();
  const task = tasks.find((candidate) => candidate.id === id);
  const [draft, setDraft] = useState({ title: task.title });

  function handleSubmit(event) {
    event.preventDefault();
    setTasks(tasks.map((candidate) => (candidate.id === id ? { ...candidate, ...draft } : candidate)));
    navigate(`/tasks/${id}`, { replace: true });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>%%editing%%</h1>
      <label htmlFor="task-title">%%title%%</label>{" "}
      <input id="task-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />{" "}
      <label htmlFor="task-due">%%dueField%%</label>{" "}
      <input id="task-due" value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} />{" "}
      <button>%%save%%</button>
    </form>
  );
}

const routes = [
  {
    path: "/tasks",
    element: <TasksLayout />,
    children: [
      { path: "", element: <h1>%%planner%%</h1> },
      { path: ":id", element: <TaskDetail /> },
      { path: ":id/edit", element: <TaskEditRoute /> },
    ],
  },
];

export default function App() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  return (
    <TasksContext.Provider value={{ tasks, setTasks }}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </TasksContext.Provider>
  );
}
