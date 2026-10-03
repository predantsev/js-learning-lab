import { Link, Outlet, Router, Routes } from "./router";
import CategoryRoute from "./CategoryRoute";
import ExpensesPage from "./ExpensesPage";

function Layout() {
  return (
    <>
      <header>
        <p>%%appName%%</p>
        <nav aria-label="%%mainNav%%">
          <Link to="/expenses">%%allExpenses%%</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "expenses", element: <ExpensesPage /> },
      { path: "categories/:id", element: <CategoryRoute /> },
    ],
  },
];

// history comes from createMemoryHistory(path) in router.jsx.
export default function App({ history }: { history: unknown }) {
  return (
    <Router history={history}>
      <Routes routes={routes} />
    </Router>
  );
}
