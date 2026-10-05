// The app: the data of the list for every screen, the router and the route table.
//   #/expenses            the list with the form for a new expense   (ExpensesScreen)
//   #/expenses/:id        one expense                                 (ExpenseDetail)
//   #/expenses/:id/edit   the edit form of one expense                (ExpenseEdit)
//   anything else      a not-found screen                       (NotFound)
// ExpensesLayout stays mounted while the screens under it change: it shows the heading and the state of
// the starting load, and the screens only once the list is known.
import { useState } from "react";
import { Router, Routes, Outlet, createHashHistory, useLocation } from "./router.tsx";
import type { RouteDef } from "./router.tsx";
import { useExpenses, useExpensesData, ExpensesContext } from "./useExpenses.ts";
import { ExpensesScreen } from "./ExpensesScreen.tsx";
import { ExpenseDetail } from "./ExpenseDetail.tsx";
import { ExpenseEdit } from "./ExpenseEdit.tsx";
import { NotFound } from "./NotFound.tsx";
import { ScreenBoundary } from "./ScreenBoundary.tsx";

function ExpensesLayout() {
  const { path } = useLocation();
  const { load, retry } = useExpensesData();
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/expense.svg" alt="%%imageAlt%%" />
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

const routes: RouteDef[] = [
  {
    path: "/expenses",
    element: <ExpensesLayout />,
    children: [
      { path: "", element: <ExpensesScreen /> },
      { path: ":id", element: <ExpenseDetail /> },
      { path: ":id/edit", element: <ExpenseEdit /> },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export function App() {
  const data = useExpenses();
  // One history for the life of the page (a function given to useState runs once).
  const [history] = useState(() => createHashHistory("/expenses"));
  return (
    <ExpensesContext.Provider value={data}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </ExpensesContext.Provider>
  );
}
