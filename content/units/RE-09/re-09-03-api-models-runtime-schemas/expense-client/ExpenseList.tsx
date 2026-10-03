import { useEffect, useState } from "react";
import { fetchExpenses } from "./fixtureApi";
import { parseExpenseList, toExpense } from "./expenseModel";
import type { ApiExpense, Expense, ParseResult } from "./expenseModel";

// false: trust the response with a cast. true: check it with the runtime schema.
const USE_SCHEMA = false;

const MESSAGES: Record<string, string> = {
  positiveInteger: "%%positiveInteger%%",
  date: "%%badDate%%",
  required: "%%required%%",
  notObject: "%%notObject%%",
  notArray: "%%notArray%%",
};

async function loadExpenses(): Promise<ParseResult<Expense[]>> {
  const body = await fetchExpenses();
  if (USE_SCHEMA) return parseExpenseList(body);
  const records = body as ApiExpense[]; // a claim, not a check
  return { ok: true, value: records.map(toExpense) };
}

const money = (minor: number) => `${(minor / 100).toFixed(2)} %%uah%%`;

export default function ExpenseList() {
  const [result, setResult] = useState<ParseResult<Expense[]> | null>(null);

  useEffect(() => {
    let ignore = false;
    loadExpenses().then((next) => {
      if (!ignore) setResult(next);
    });
    return () => {
      ignore = true;
    };
  }, []);

  if (result === null) return <p role="status">%%loading%%</p>;
  if (!result.ok) {
    console.log("errors:", result.errors);
    return (
      <div role="alert">
        <p>%%badResponse%%</p>
        <ul>
          {Object.entries(result.errors).map(([field, key]) => (
            <li key={field}>
              {field}: {MESSAGES[key] ?? key}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const total = result.value.reduce((sum, expense) => sum + expense.amountMinor, 0);
  console.log("total:", total);
  return (
    <section>
      <ul>
        {result.value.map((expense) => (
          <li key={expense.id}>
            {expense.label} — {money(expense.amountMinor)}
          </li>
        ))}
      </ul>
      <p>
        %%total%% {money(total)}
      </p>
    </section>
  );
}
