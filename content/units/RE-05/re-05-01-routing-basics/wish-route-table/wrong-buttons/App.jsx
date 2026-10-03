import { Router, Routes, useNavigate } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { history } from "./history";

function MainNav() {
  const navigate = useNavigate();
  return (
    <nav aria-label="%%mainNav%%">
      <button onClick={() => navigate("/items")}>%%wishes%%</button>
      <button onClick={() => navigate("/about")}>%%about%%</button>
    </nav>
  );
}

function ItemList() {
  return (
    <section>
      <h1>%%wishes%%</h1>
      <ul>
        <li>%%headphones%%</li>
        <li>%%lamp%%</li>
        <li>%%bicycle%%</li>
      </ul>
    </section>
  );
}

function About() {
  return (
    <section>
      <h1>%%about%%</h1>
      <p>%%aboutText%%</p>
    </section>
  );
}

function NotFound() {
  return (
    <section>
      <h1>%%notFound%%</h1>
      <p>%%notFoundText%%</p>
    </section>
  );
}

const routes = [
  { path: "/items", element: <ItemList /> },
  { path: "/about", element: <About /> },
  { path: "*", element: <NotFound /> },
];

export default function App() {
  return (
    <Router history={history}>
      <HistoryPanel />
      <MainNav />
      <Routes routes={routes} />
    </Router>
  );
}
