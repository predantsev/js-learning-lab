// The app: the query cache for every screen, the router and the route table.
//   #/habits            the list with the form for a new habit   (HabitsScreen)
//   #/habits/:id/history the checkpoint enhancement                (HabitHistory)
//   #/habits/summary    the summary, loaded lazily              (SummaryRoute)
//   #/habits/:id        one habit                                 (HabitDetail)
//   #/habits/:id/edit   the edit form of one habit                (HabitEdit)
//   anything else      a not-found screen                       (NotFound)
// HabitsLayout stays mounted while the screens under it change. Every screen asks the fixture API
// through the cache and shows its own loading, error and empty states.
import { useState } from "react";
import { Router, Routes, Outlet, createHashHistory, useLocation } from "./router.tsx";
import type { RouteDef } from "./router.tsx";
import { HabitsCacheProvider } from "./habitsCache.tsx";
import { HabitsScreen } from "./HabitsScreen.tsx";
import { HabitDetail } from "./HabitDetail.tsx";
import { HabitEdit } from "./HabitEdit.tsx";
import { NotFound } from "./NotFound.tsx";
import { SummaryRoute } from "./SummaryRoute.tsx";
import { HabitHistory } from "./HabitHistory.tsx";
import { ScreenBoundary } from "./ScreenBoundary.tsx";

function HabitsLayout() {
  const { path } = useLocation();
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/habit.svg" alt="%%imageAlt%%" />
      <ScreenBoundary key={path}>
        <Outlet />
      </ScreenBoundary>
    </main>
  );
}

export function App({ today, days }: { today: string; days: string[] }) {
  // The route table is built here because its screens need the fixed days from the props.
  const routes: RouteDef[] = [
    {
      path: "/habits",
      element: <HabitsLayout />,
      children: [
        { path: "", element: <HabitsScreen today={today} days={days} /> },
        { path: ":id/history", element: <HabitHistory today={today} /> },
        { path: "summary", element: <SummaryRoute today={today} days={days} /> },
        { path: ":id", element: <HabitDetail today={today} /> },
        { path: ":id/edit", element: <HabitEdit /> },
      ],
    },
    { path: "*", element: <NotFound /> },
  ];
  // One history for the life of the page (a function given to useState runs once).
  const [history] = useState(() => createHashHistory("/habits"));
  return (
    <HabitsCacheProvider>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </HabitsCacheProvider>
  );
}
