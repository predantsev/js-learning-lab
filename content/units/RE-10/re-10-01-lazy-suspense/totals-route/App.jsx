import { lazy, Suspense } from "react";
import { Router, Routes, Link, Outlet, createMemoryHistory } from "./router";
import { slowly } from "./slowImport";
import { wishes } from "./wishes";

// StatsPanel.jsx is requested only when the totals route is shown for the first time.
const StatsPanel = lazy(slowly(() => import("./StatsPanel")));

const history = createMemoryHistory("/items");

function Layout() {
  return (
    <div>
      <h1>%%myWishes%%</h1>
      <nav aria-label="%%mainNav%%">
        <Link to="/items">%%list%%</Link> · <Link to="/stats">%%totals%%</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function WishList() {
  return (
    <ul>
      {wishes.map((wish) => (
        <li key={wish.id}>{wish.name}</li>
      ))}
    </ul>
  );
}

const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "items", element: <WishList /> },
      { path: "stats", element: <StatsPanel /> },
    ],
  },
];

export default function App() {
  return (
    <Suspense fallback={<p role="status">%%loading%%</p>}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </Suspense>
  );
}
