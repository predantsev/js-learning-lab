import { createRoot } from "react-dom/client";
import { Summary } from "./Summary";
import { expenses } from "./expenses.js";

function App() {
  return (
    <main>
      <Summary />
      <ul>{expenses.map((expense) => <li key={expense.id}>{expense.label}</li>)}</ul>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
