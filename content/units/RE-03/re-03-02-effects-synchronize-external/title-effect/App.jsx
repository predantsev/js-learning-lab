import { useEffect, useState } from "react";

const RECORDS = [
  { id: "e-01", label: "%%groceries%%" },
  { id: "e-02", label: "%%transit%%" },
];

export default function ExpenseTitle() {
  const [records, setRecords] = useState(RECORDS);
  console.log(`render: ${records.length}`);

  useEffect(() => {
    // Runs after React has put this render on the screen.
    document.title = `%%titlePrefix%% ${records.length}`;
    const shown = document.querySelector("h2").textContent;
    console.log(`effect: title = "${document.title}", screen → ${shown}`);
  });

  function addRecord() {
    const id = `e-${String(records.length + 1).padStart(2, "0")}`;
    setRecords([...records, { id, label: "%%newExpense%%" }]);
  }

  return (
    <section>
      <h2>%%heading%% {records.length}</h2>
      <ul>
        {records.map((record) => (
          <li key={record.id}>{record.label}</li>
        ))}
      </ul>
      <button onClick={addRecord}>%%add%%</button>
      <button onClick={() => setRecords(records.slice(0, -1))}>%%removeLast%%</button>
    </section>
  );
}
