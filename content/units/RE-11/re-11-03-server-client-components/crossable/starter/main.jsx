import { createRoot } from "react-dom/client";
import { assertCrossable } from "./crossable";
import { Budget } from "./budget";

// Two ways a page could hand an expense card its props.
const CANDIDATES = [
  {
    label: "%%plainCard%%",
    props: {
      expense: { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: new Date("2026-03-01T00:00:00Z") },
      categories: new Map([["food", "%%food%%"], ["fun", "%%fun%%"]]),
      tags: new Set(["%%weekly%%"]),
    },
  },
  {
    label: "%%richCard%%",
    props: {
      expense: { id: "e-03", label: "%%coffee%%", amountMinor: 18000, date: new Date("2026-02-28T00:00:00Z") },
      budget: new Budget(500000),
      onDelete: () => console.log("delete e-03"),
    },
  },
];

function verdict(props) {
  try {
    assertCrossable(props);
    return "%%crosses%%";
  } catch (error) {
    return `%%blocked%%: ${error.message}`;
  }
}

createRoot(document.getElementById("root")).render(
  <ul>
    {CANDIDATES.map((candidate) => (
      <li key={candidate.label}>
        <b>{candidate.label}</b>: {verdict(candidate.props)}
      </li>
    ))}
  </ul>,
);
