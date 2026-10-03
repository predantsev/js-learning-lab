// The app: the data of the list for every screen, the router and the route table.
//   #/tasks            the list with the form for a new task   (TasksScreen)
//   #/tasks/:id        one task                                 (TaskDetail)
//   #/tasks/:id/edit   the edit form of one task                (TaskEdit)
//   anything else      a not-found screen                       (NotFound)
// TasksLayout stays mounted while the screens under it change: it shows the heading and the state of
// the starting load, and the screens only once the list is known.
import { useState } from "react";
import { Router, Routes, Outlet, createHashHistory, useLocation } from "./router.tsx";
import type { RouteDef } from "./router.tsx";
import { useTasks, useTasksData, TasksContext } from "./useTasks.ts";
import { TasksScreen } from "./TasksScreen.tsx";
import { TaskDetail } from "./TaskDetail.tsx";
import { TaskEdit } from "./TaskEdit.tsx";
import { NotFound } from "./NotFound.tsx";
import { ScreenBoundary } from "./ScreenBoundary.tsx";

function TasksLayout() {
  const { path } = useLocation();
  const { load, retry } = useTasksData();
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/task.svg" alt="%%imageAlt%%" />
      {/* role="status": a screen reader reads the new text without moving focus. */}
      <p role="status">{load.kind === "loading" ? "%%loadingMessage%%" : load.kind === "failed" ? load.message : ""}</p>
      {load.kind === "failed" && (
        <button type="button" onClick={retry}>
          %%retryLoadLabel%%
        </button>
      )}
      {load.kind === "ready" && (
        <ScreenBoundary key={path}>
          <Outlet />
        </ScreenBoundary>
      )}
    </main>
  );
}


export function App({ today }: { today: string }) {
  const data = useTasks();
  // The route table is built here because its screens need the fixed days from the props.
  const routes: RouteDef[] = [
    {
      path: "/tasks",
      element: <TasksLayout />,
      children: [
        { path: "", element: <TasksScreen today={today} /> },
        { path: ":id", element: <TaskDetail /> },
        { path: ":id/edit", element: <TaskEdit /> },
      ],
    },
    { path: "*", element: <NotFound /> },
  ];
  // One history for the life of the page (a function given to useState runs once).
  const [history] = useState(() => createHashHistory("/tasks"));
  return (
    <TasksContext.Provider value={data}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </TasksContext.Provider>
  );
}
