// The app: the query cache for every screen, the router and the route table.
//   #/tasks            the list with the form for a new task   (TasksScreen)
//   #/tasks/summary    the summary, loaded lazily              (SummaryRoute)
//   #/tasks/:id        one task                                 (TaskDetail)
//   #/tasks/:id/edit   the edit form of one task                (TaskEdit)
//   anything else      a not-found screen                       (NotFound)
// TasksLayout stays mounted while the screens under it change. Every screen asks the fixture API
// through the cache and shows its own loading, error and empty states.
import { useState } from "react";
import { Router, Routes, Outlet, createHashHistory, useLocation } from "./router.tsx";
import type { RouteDef } from "./router.tsx";
import { TasksCacheProvider } from "./tasksCache.tsx";
import { TasksScreen } from "./TasksScreen.tsx";
import { TaskDetail } from "./TaskDetail.tsx";
import { TaskEdit } from "./TaskEdit.tsx";
import { NotFound } from "./NotFound.tsx";
import { SummaryRoute } from "./SummaryRoute.tsx";
import { ScreenBoundary } from "./ScreenBoundary.tsx";

function TasksLayout() {
  const { path } = useLocation();
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/task.svg" alt="%%imageAlt%%" />
      <ScreenBoundary key={path}>
        <Outlet />
      </ScreenBoundary>
    </main>
  );
}

export function App({ today }: { today: string }) {
  // The route table is built here because its screens need the fixed days from the props.
  const routes: RouteDef[] = [
    {
      path: "/tasks",
      element: <TasksLayout />,
      children: [
        { path: "", element: <TasksScreen today={today} /> },
        { path: "summary", element: <SummaryRoute today={today} /> },
        { path: ":id", element: <TaskDetail /> },
        { path: ":id/edit", element: <TaskEdit /> },
      ],
    },
    { path: "*", element: <NotFound /> },
  ];
  // One history for the life of the page (a function given to useState runs once).
  const [history] = useState(() => createHashHistory("/tasks"));
  return (
    <TasksCacheProvider>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </TasksCacheProvider>
  );
}
