import { Router, Routes, Link } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { history } from "./history";

const NAV_LINKS = [
  { to: "/items", text: "%%wishes%%" },
  { to: "/about", text: "%%about%%" },
];

function MainNav() {
  return (
    <nav aria-label="%%mainNav%%">
      <ul>
        {NAV_LINKS.map((link) => (
          <li key={link.to}>
            <Link to={link.to}>{link.text}</Link>
          </li>
        ))}
      </ul>
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
  { path: "/about", element: <About /> },
  { path: "/items", element: <ItemList /> },
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
