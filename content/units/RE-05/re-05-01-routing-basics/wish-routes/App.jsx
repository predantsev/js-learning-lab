import { Router, Routes, Link, useNavigate, createMemoryHistory } from "./router";
import { HistoryPanel } from "./HistoryPanel";

const history = createMemoryHistory("/items");

function ItemList() {
  return (
    <section>
      <h1>%%wishes%%</h1>
      <ul>
        <li>
          <Link to="/items/w-02">%%lamp%%</Link>
        </li>
      </ul>
    </section>
  );
}

function ItemDetail() {
  return (
    <section>
      <h1>%%lamp%%</h1>
      <p>%%price%%: 45</p>
      <Link to="/items/w-02/edit">%%edit%%</Link>
    </section>
  );
}

function ItemEdit() {
  const navigate = useNavigate();
  return (
    <section>
      <h1>%%editing%%</h1>
      <p>%%formPlaceholder%%</p>
      <button onClick={() => navigate("/items/w-02")}>%%save%%</button>
    </section>
  );
}

const routes = [
  { path: "/items", element: <ItemList /> },
  { path: "/items/w-02", element: <ItemDetail /> },
  { path: "/items/w-02/edit", element: <ItemEdit /> },
];

export default function App() {
  return (
    <Router history={history}>
      <HistoryPanel />
      <Routes routes={routes} />
    </Router>
  );
}
