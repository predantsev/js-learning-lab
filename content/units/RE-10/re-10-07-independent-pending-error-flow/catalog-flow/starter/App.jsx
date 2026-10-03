import { useState } from "react";
import { Router, Routes, Link, Outlet } from "./router";
import { history } from "./history";
import { CatalogList } from "./CatalogList";
import ItemDetails from "./ItemDetails";

function CatalogPage() {
  const [query, setQuery] = useState("");
  return (
    <>
      <label>
        %%search%% <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div>
        <CatalogList query={query} />
      </div>
    </>
  );
}

function Layout() {
  return (
    <div>
      <h1>%%catalogTitle%%</h1>
      <nav aria-label="%%mainNav%%">
        <Link to="/items">%%allItems%%</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

const routes = [
  {
    path: "/items",
    element: <Layout />,
    children: [
      { path: "", element: <CatalogPage /> },
      { path: ":id", element: <ItemDetails /> },
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
