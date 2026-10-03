import { createContext, useContext, useState } from "react";
import { Router, Routes, Link, Outlet, useParams, useNavigate, createMemoryHistory } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { LeaveDialog } from "./LeaveDialog";
import { INITIAL_EXPENSES, formatAmount, parseAmount } from "./expenses.js";

const ExpensesContext = createContext(null);

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
  return <h1>%%expenses%%</h1>;
}

function ExpenseDetail() {
  const { id } = useParams();
  const { expenses } = useContext(ExpensesContext);
  const expense = expenses.find((candidate) => candidate.id === id);
  if (expense === undefined) return <h1>%%notFound%%</h1>;
  return (
    <section>
      <h1>{expense.label}</h1>
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
  const [draft, setDraft] = useState({ label: saved.label });

  function handleSubmit(event) {
    event.preventDefault();
    const changes = { label: draft.label, amountMinor: parseAmount(draft.amount) };
    setExpenses(expenses.map((expense) => (expense.id === id ? { ...expense, ...changes } : expense)));
    navigate(`/expenses/${id}`, { replace: true });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>%%editing%%</h1>
      <label htmlFor="expense-label">%%label%%</label>{" "}
      <input id="expense-label" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />{" "}
      <label htmlFor="expense-amount">%%amount%%</label>{" "}
      <input id="expense-amount" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} />{" "}
      <button>%%save%%</button>
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
