// The app: the data of the list for every screen, the router and the route table.
//   #/habits            the list with the form for a new habit   (HabitsScreen)
//   #/habits/:id        one habit                                 (HabitDetail)
//   #/habits/:id/edit   the edit form of one habit                (HabitEdit)
//   anything else      a not-found screen                       (NotFound)
// HabitsLayout stays mounted while the screens under it change: it shows the heading and the state of
// the starting load, and the screens only once the list is known.
import { useState } from "react";
import { Router, Routes, Outlet, createHashHistory, useLocation } from "./router.tsx";
import type { RouteDef } from "./router.tsx";
import { useHabits, useHabitsData, HabitsContext } from "./useHabits.ts";
import { HabitsScreen } from "./HabitsScreen.tsx";
import { HabitDetail } from "./HabitDetail.tsx";
import { HabitEdit } from "./HabitEdit.tsx";
import { NotFound } from "./NotFound.tsx";
import { ScreenBoundary } from "./ScreenBoundary.tsx";

function HabitsLayout() {
  const { path } = useLocation();
  const { load, retry } = useHabitsData();
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/habit.svg" alt="%%imageAlt%%" />
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


export function App({ today, days }: { today: string; days: string[] }) {
  const data = useHabits();
  // The route table is built here because its screens need the fixed days from the props.
  const routes: RouteDef[] = [
    {
      path: "/habits",
      element: <HabitsLayout />,
      children: [
        { path: "", element: <HabitsScreen today={today} days={days} /> },
        { path: ":id", element: <HabitDetail today={today} /> },
        { path: ":id/edit", element: <HabitEdit /> },
      ],
    },
    { path: "*", element: <NotFound /> },
  ];
  // One history for the life of the page (a function given to useState runs once).
  const [history] = useState(() => createHashHistory("/habits"));
  return (
    <HabitsContext.Provider value={data}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </HabitsContext.Provider>
  );
}
