import { Router, Routes, Link } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { history } from "./history";

function MainNav() {
  return (
    <nav aria-label="%%mainNav%%">
      <Link to="/items">%%wishes%%</Link> · <Link to="/about">%%about%%</Link>
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
