import { useReducer } from "react";

// React passes the reducer the state left by the previous action, like an updater function.
function addTickets(tickets, amount) {
  return tickets + amount;
}

export default function TicketCounter() {
  const [tickets, add] = useReducer(addTickets, 0);

  function handleAddOne() {
    add(1);
  }

  function handleAddFive() {
    add(5);
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
