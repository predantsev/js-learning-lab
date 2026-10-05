import { useState } from "react";

export default function TicketCounter() {
  const [tickets, setTickets] = useState(0);

  function handleAddOne() {
    setTickets(tickets + 1);
  }

  function handleAddFive() {
    setTickets(tickets + 5);
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
