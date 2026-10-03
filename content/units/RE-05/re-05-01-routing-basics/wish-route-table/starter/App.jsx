import { Router, Routes, Link } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { history } from "./history";

function MainNav() {
  // TODO: a link "%%wishes%%" to /items and a link "%%about%%" to /about
  return <nav aria-label="%%mainNav%%"></nav>;
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

// TODO: /items shows ItemList, /about shows About, any other path shows NotFound
const routes = [];

export default function App() {
  return (
    <Router history={history}>
      <HistoryPanel />
      <MainNav />
      <Routes routes={routes} />
    </Router>
  );
}
