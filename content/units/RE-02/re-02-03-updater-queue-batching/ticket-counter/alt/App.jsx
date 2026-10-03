import { useState } from "react";

export default function TicketCounter() {
  const [tickets, setTickets] = useState(0);

  function handleAddOne() {
    setTickets((previous) => {
      return previous + 1;
    });
  }

  function handleAddFive() {
    for (let i = 0; i < 5; i += 1) {
      setTickets((previous) => previous + 1);
    }
  }

  return (
    <section>
      <h1>%%cinema%%</h1>
      <p className="tickets">%%tickets%%: {tickets}</p>
      <button onClick={handleAddOne}>+1</button>{" "}
      <button onClick={handleAddFive}>+5</button>
    </section>
  );
}
