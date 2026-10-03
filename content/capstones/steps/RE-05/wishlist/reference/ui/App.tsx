// The app: the data of the list for every screen, the router and the route table.
//   #/items            the list with the form for a new wish   (ItemsScreen)
//   #/items/:id        one wish                                 (ItemDetail)
//   #/items/:id/edit   the edit form of one wish                (ItemEdit)
//   anything else      a not-found screen                       (NotFound)
// ItemsLayout stays mounted while the screens under it change: it shows the heading and the state of
// the starting load, and the screens only once the list is known.
import { useState } from "react";
import { Router, Routes, Outlet, createHashHistory, useLocation } from "./router.tsx";
import type { RouteDef } from "./router.tsx";
import { useItems, useItemsData, ItemsContext } from "./useItems.ts";
import { ItemsScreen } from "./ItemsScreen.tsx";
import { ItemDetail } from "./ItemDetail.tsx";
import { ItemEdit } from "./ItemEdit.tsx";
import { NotFound } from "./NotFound.tsx";
import { ScreenBoundary } from "./ScreenBoundary.tsx";

function ItemsLayout() {
  const { path } = useLocation();
  const { load, retry } = useItemsData();
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/wish.svg" alt="%%imageAlt%%" />
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
    path: "/items",
    element: <ItemsLayout />,
    children: [
      { path: "", element: <ItemsScreen /> },
      { path: ":id", element: <ItemDetail /> },
      { path: ":id/edit", element: <ItemEdit /> },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export function App() {
  const data = useItems();
  // One history for the life of the page (a function given to useState runs once).
  const [history] = useState(() => createHashHistory("/items"));
  return (
    <ItemsContext.Provider value={data}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </ItemsContext.Provider>
  );
}
