// The app: the query cache for every screen, the router and the route table.
//   #/items            the list with the form for a new wish   (ItemsScreen)
//   #/items/categories the checkpoint enhancement                (ItemCategories)
//   #/items/summary    the summary, loaded lazily              (SummaryRoute)
//   #/items/:id        one wish                                 (ItemDetail)
//   #/items/:id/edit   the edit form of one wish                (ItemEdit)
//   anything else      a not-found screen                       (NotFound)
// ItemsLayout stays mounted while the screens under it change. Every screen asks the fixture API
// through the cache and shows its own loading, error and empty states.
import { useState } from "react";
import { Router, Routes, Outlet, createHashHistory, useLocation } from "./router.tsx";
import type { RouteDef } from "./router.tsx";
import { ItemsCacheProvider } from "./itemsCache.tsx";
import { ItemsScreen } from "./ItemsScreen.tsx";
import { ItemDetail } from "./ItemDetail.tsx";
import { ItemEdit } from "./ItemEdit.tsx";
import { NotFound } from "./NotFound.tsx";
import { SummaryRoute } from "./SummaryRoute.tsx";
import { ItemCategories } from "./ItemCategories.tsx";
import { ScreenBoundary } from "./ScreenBoundary.tsx";

function ItemsLayout() {
  const { path } = useLocation();
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/wish.svg" alt="%%imageAlt%%" />
      <ScreenBoundary key={path}>
        <Outlet />
      </ScreenBoundary>
    </main>
  );
}

const routes: RouteDef[] = [
  {
    path: "/items",
    element: <ItemsLayout />,
    children: [
      { path: "", element: <ItemsScreen /> },
      { path: "categories", element: <ItemCategories /> },
      { path: "summary", element: <SummaryRoute /> },
      { path: ":id", element: <ItemDetail /> },
      { path: ":id/edit", element: <ItemEdit /> },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export function App() {
  // One history for the life of the page (a function given to useState runs once).
  const [history] = useState(() => createHashHistory("/items"));
  return (
    <ItemsCacheProvider>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </ItemsCacheProvider>
  );
}
