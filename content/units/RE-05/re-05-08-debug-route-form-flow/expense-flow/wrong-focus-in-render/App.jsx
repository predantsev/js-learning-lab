import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Router, Routes, Link, Outlet, useParams, useNavigate, useLocation, useBlocker, createMemoryHistory } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { LeaveDialog } from "./LeaveDialog";
import { INITIAL_EXPENSES, formatAmount, parseAmount } from "./expenses.js";

const ExpensesContext = createContext(null);

function useHeadingFocus() {
  const headingRef = useRef(null);
  const { action } = useLocation();
  if (action !== "initial") headingRef.current?.focus();
  return headingRef;
}

function ExpensesLayout() {
  const { expenses } = useContext(ExpensesContext);
  return (
    <div>
      <HistoryPanel />
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            <Link to={`/expenses/${expense.id}`}>{expense.label}</Link>
          </li>
        ))}
      </ul>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function ExpenseList() {
  const headingRef = useHeadingFocus();
  return (
    <h1 tabIndex={-1} ref={headingRef}>
      %%expenses%%
    </h1>
  );
}

function ExpenseDetail() {
  const { id } = useParams();
  const { expenses } = useContext(ExpensesContext);
  const expense = expenses.find((candidate) => candidate.id === id);
  const headingRef = useHeadingFocus();
  if (expense === undefined)
    return (
      <h1 tabIndex={-1} ref={headingRef}>
        %%notFound%%
      </h1>
    );
  return (
    <section>
      <h1 tabIndex={-1} ref={headingRef}>
        {expense.label}
      </h1>
      <p>
        %%amount%% {formatAmount(expense.amountMinor)}
      </p>
      <Link to={`/expenses/${id}/edit`}>%%edit%%</Link>
    </section>
  );
}

function ExpenseEditRoute() {
  const { id } = useParams();
  return <ExpenseEdit key={id} id={id} />;
}

function ExpenseEdit({ id }) {
  const { expenses, setExpenses } = useContext(ExpensesContext);
  const navigate = useNavigate();
  const saved = expenses.find((candidate) => candidate.id === id);
  const [draft, setDraft] = useState({ label: saved.label, amount: formatAmount(saved.amountMinor) });
  const headingRef = useHeadingFocus();
  const isDirty = draft.label !== saved.label || draft.amount !== formatAmount(saved.amountMinor);
  const blocker = useBlocker(isDirty);
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  function handleSubmit(event) {
    event.preventDefault();
    const changes = { label: draft.label, amountMinor: parseAmount(draft.amount) };
    setExpenses(expenses.map((expense) => (expense.id === id ? { ...expense, ...changes } : expense)));
    navigate(`/expenses/${id}`, { replace: true, skipGuard: true });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 tabIndex={-1} ref={headingRef}>
        %%editing%%
      </h1>
      <label htmlFor="expense-label">%%label%%</label>{" "}
      <input id="expense-label" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />{" "}
      <label htmlFor="expense-amount">%%amount%%</label>{" "}
      <input id="expense-amount" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} />{" "}
      <button>%%save%%</button>
      {blocker.blocked && <LeaveDialog onStay={blocker.stay} onLeave={blocker.proceed} />}
    </form>
  );
}

const routes = [
  {
    path: "/expenses",
    element: <ExpensesLayout />,
    children: [
      { path: "", element: <ExpenseList /> },
      { path: ":id", element: <ExpenseDetail /> },
      { path: ":id/edit", element: <ExpenseEditRoute /> },
    ],
  },
];

export default function App() {
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [history] = useState(() => createMemoryHistory("/expenses"));
  return (
    <ExpensesContext.Provider value={{ expenses, setExpenses }}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </ExpensesContext.Provider>
  );
}
