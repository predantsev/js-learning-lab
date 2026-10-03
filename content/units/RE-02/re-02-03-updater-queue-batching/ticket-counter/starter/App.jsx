import { useState } from "react";

export default function TicketCounter() {
  const [tickets, setTickets] = useState(0);

  function handleAddOne() {
    // TODO: add 1 ticket
  }

  function handleAddFive() {
    // TODO: add 5 tickets
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
