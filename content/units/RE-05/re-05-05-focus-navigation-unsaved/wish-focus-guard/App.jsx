import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Router, Routes, Link, Outlet, useParams, useLocation, useNavigate, useBlocker, createMemoryHistory } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { FocusReport } from "./FocusReport";
import { INITIAL_ITEMS } from "./items.js";

const history = createMemoryHistory("/items");
const ItemsContext = createContext(null);

// After every route change (not on the first load): set the tab's title and focus the screen's heading.
function useRouteFocus(title) {
  const headingRef = useRef(null);
  const { path, action } = useLocation();
  useEffect(() => {
    document.title = title;
    if (action !== "initial") headingRef.current.focus();
  }, [path, action, title]);
  return headingRef;
}

function ItemsLayout() {
  const { items } = useContext(ItemsContext);
  return (
    <div>
      <HistoryPanel />
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/items/${item.id}`}>{item.name}</Link>
          </li>
        ))}
      </ul>
      <main>
        <Outlet />
      </main>
      <FocusReport />
    </div>
  );
}

function ItemList() {
  const headingRef = useRouteFocus("%%wishes%%");
  return (
    <h1 tabIndex={-1} ref={headingRef}>
      %%wishes%%
    </h1>
  );
}

function ItemDetail() {
  const { id } = useParams();
  const { items } = useContext(ItemsContext);
  const item = items.find((candidate) => candidate.id === id);
  const headingRef = useRouteFocus(item ? item.name : "%%notFound%%");
  if (item === undefined) return <h1 tabIndex={-1} ref={headingRef}>%%notFound%%</h1>;
  return (
    <section>
      <h1 tabIndex={-1} ref={headingRef}>
        {item.name}
      </h1>
      <p>%%price%% {item.price}</p>
      <Link to={`/items/${id}/edit`}>%%edit%%</Link>
    </section>
  );
}

function ItemEditRoute() {
  const { id } = useParams();
  return <ItemEdit key={id} id={id} />; // a new id gets a new form with a fresh draft
}

function ItemEdit({ id }) {
  const { items, setItems } = useContext(ItemsContext);
  const navigate = useNavigate();
  const saved = items.find((candidate) => candidate.id === id);
  const [draft, setDraft] = useState({ name: saved.name, price: String(saved.price) });
  const headingRef = useRouteFocus(`%%editing%%: ${saved.name}`);
  const isDirty = draft.name !== saved.name || draft.price !== String(saved.price);
  const blocker = useBlocker(isDirty);

  function handleSubmit(event) {
    event.preventDefault();
    setItems(items.map((item) => (item.id === id ? { ...item, name: draft.name, price: Number(draft.price) } : item)));
    navigate(`/items/${id}`, { replace: true, skipGuard: true }); // saved: nothing to lose
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 tabIndex={-1} ref={headingRef}>
        %%editing%%: {saved.name}
      </h1>
      <label htmlFor="item-name">%%name%%</label>{" "}
      <input id="item-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />{" "}
      <label htmlFor="item-price">%%price%%</label>{" "}
      <input id="item-price" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} />{" "}
      <button>%%save%%</button>
      {blocker.blocked && <LeaveDialog onStay={blocker.stay} onLeave={blocker.proceed} />}
    </form>
  );
}

function LeaveDialog({ onStay, onLeave }) {
  const stayRef = useRef(null);
  useEffect(() => {
    const opener = document.activeElement; // the control that started the navigation
    stayRef.current.focus();
    return () => opener.focus(); // after Stay, focus goes back there instead of falling to body
  }, []);
  return (
    <div role="alertdialog" aria-labelledby="leave-text" style={{ border: "2px solid dimgray", padding: "0.5rem" }}>
      <p id="leave-text">%%unsaved%%</p>
      <button type="button" ref={stayRef} onClick={onStay}>
        %%stay%%
      </button>{" "}
      <button type="button" onClick={onLeave}>
        %%leave%%
      </button>
    </div>
  );
}

const routes = [
  {
    path: "/items",
    element: <ItemsLayout />,
    children: [
      { path: "", element: <ItemList /> },
      { path: ":id", element: <ItemDetail /> },
      { path: ":id/edit", element: <ItemEditRoute /> },
    ],
  },
];

export default function App() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  return (
    <ItemsContext.Provider value={{ items, setItems }}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </ItemsContext.Provider>
  );
}
