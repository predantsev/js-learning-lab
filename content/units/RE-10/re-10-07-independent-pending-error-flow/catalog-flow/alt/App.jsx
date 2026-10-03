import { lazy, Suspense, useDeferredValue, useState } from "react";
import { Router, Routes, Link, Outlet } from "./router";
import { history } from "./history";
import { slowly } from "./slowImport";
import { CatalogList } from "./CatalogList";
import { ErrorBoundary } from "./ErrorBoundary";

const loadDetails = slowly(() => import("./ItemDetails"));

function CatalogPage() {
  const [text, setText] = useState("");
  const shownText = useDeferredValue(text);
  return (
    <>
      <label>
        %%search%% <input value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      <div style={{ opacity: text === shownText ? 1 : 0.4 }}>
        <CatalogList query={shownText} />
      </div>
    </>
  );
}

let ItemDetails = lazy(loadDetails);

function DetailsPage() {
  return <ItemDetails />;
}

function Layout() {
  const [attempt, setAttempt] = useState(0);
  function retry() {
    ItemDetails = lazy(loadDetails); // a failed lazy load is remembered: start a new one
    setAttempt(attempt + 1);
  }
  return (
    <div>
      <h1>%%catalogTitle%%</h1>
      <nav aria-label="%%mainNav%%">
        <Link to="/items">%%allItems%%</Link>
      </nav>
      <ErrorBoundary key={attempt} onRetry={retry}>
        <Suspense fallback={<p role="status">%%loadingDetails%%</p>}>
          <main>
            <Outlet />
          </main>
        </Suspense>
      </ErrorBoundary>
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
