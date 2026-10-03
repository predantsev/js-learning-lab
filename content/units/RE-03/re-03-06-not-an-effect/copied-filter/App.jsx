import { useEffect, useState } from "react";

const EXPENSES = [
  { id: "e-01", label: "%%groceries%%", category: "food" },
  { id: "e-02", label: "%%transit%%", category: "transport" },
  { id: "e-03", label: "%%coffee%%", category: "fun" },
  { id: "e-06", label: "%%lunch%%", category: "food" },
];
const CATEGORIES = [
  { id: "all", label: "%%all%%" },
  { id: "food", label: "%%food%%" },
  { id: "fun", label: "%%fun%%" },
];

export default function ExpenseList() {
  const [category, setCategory] = useState("all");
  // A copy of something that can be computed: it needs an effect to stay in sync.
  const [visible, setVisible] = useState([]);
  console.log(`render: ${visible.length} shown`);

  useEffect(() => {
    setVisible(EXPENSES.filter((expense) => category === "all" || expense.category === category));
  }, [category]);

  return (
    <section>
      {CATEGORIES.map((option) => (
        <button key={option.id} aria-pressed={category === option.id} onClick={() => setCategory(option.id)}>
          {option.label}
        </button>
      ))}
      <ul>
        {visible.map((expense) => (
          <li key={expense.id}>{expense.label}</li>
        ))}
      </ul>
    </section>
  );
}
