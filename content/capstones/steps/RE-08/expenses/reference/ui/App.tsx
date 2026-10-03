// The app: the query cache for every screen, the router and the route table.
//   #/expenses            the list with the form for a new expense   (ExpensesScreen)
//   #/expenses/months     the checkpoint enhancement                (MonthTotals)
//   #/expenses/summary    the summary, loaded lazily              (SummaryRoute)
//   #/expenses/:id        one expense                                 (ExpenseDetail)
//   #/expenses/:id/edit   the edit form of one expense                (ExpenseEdit)
//   anything else      a not-found screen                       (NotFound)
// ExpensesLayout stays mounted while the screens under it change. Every screen asks the fixture API
// through the cache and shows its own loading, error and empty states.
import { useState } from "react";
import { Router, Routes, Outlet, createHashHistory, useLocation } from "./router.tsx";
import type { RouteDef } from "./router.tsx";
import { ExpensesCacheProvider } from "./expensesCache.tsx";
import { ExpensesScreen } from "./ExpensesScreen.tsx";
import { ExpenseDetail } from "./ExpenseDetail.tsx";
import { ExpenseEdit } from "./ExpenseEdit.tsx";
import { NotFound } from "./NotFound.tsx";
import { SummaryRoute } from "./SummaryRoute.tsx";
import { MonthTotals } from "./MonthTotals.tsx";
import { ScreenBoundary } from "./ScreenBoundary.tsx";

function ExpensesLayout() {
  const { path } = useLocation();
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/expense.svg" alt="%%imageAlt%%" />
      <ScreenBoundary key={path}>
        <Outlet />
      </ScreenBoundary>
    </main>
  );
}

const routes: RouteDef[] = [
  {
    path: "/expenses",
    element: <ExpensesLayout />,
    children: [
      { path: "", element: <ExpensesScreen /> },
      { path: "months", element: <MonthTotals /> },
      { path: "summary", element: <SummaryRoute /> },
      { path: ":id", element: <ExpenseDetail /> },
      { path: ":id/edit", element: <ExpenseEdit /> },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export function App() {
  // One history for the life of the page (a function given to useState runs once).
  const [history] = useState(() => createHashHistory("/expenses"));
  return (
    <ExpensesCacheProvider>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </ExpensesCacheProvider>
  );
}
