import { lazy, Suspense, useState, useTransition } from "react";
import { Router, Routes, Link, Outlet } from "./router";
import { history } from "./history";
import { slowly } from "./slowImport";
import { CatalogList } from "./CatalogList";
import { ErrorBoundary } from "./ErrorBoundary";

const loadDetails = slowly(() => import("./ItemDetails"));

function CatalogPage() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(event) {
    const value = event.target.value;
    setText(value);
    startTransition(() => setQuery(value));
  }

  return (
    <>
      <label>
        %%search%% <input value={text} onChange={handleChange} />
      </label>
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        <CatalogList query={query} />
      </div>
    </>
  );
}

// A failed lazy load is remembered, so a retry needs a new lazy component and a fresh boundary.
function DetailsPage() {
  const [ItemDetails, setItemDetails] = useState(() => lazy(loadDetails));
  const [attempt, setAttempt] = useState(0);

  function retry() {
    setItemDetails(lazy(loadDetails));
    setAttempt((n) => n + 1);
  }

  return (
    <ErrorBoundary key={attempt} onRetry={retry}>
      <Suspense fallback={<p role="status">%%loadingDetails%%</p>}>
        <ItemDetails />
      </Suspense>
    </ErrorBoundary>
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
      { path: ":id", element: <DetailsPage /> },
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
