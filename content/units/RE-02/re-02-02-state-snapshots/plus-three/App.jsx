import { useState } from "react";

export default function HabitDays() {
  const [days, setDays] = useState(0);
  console.log("render: days =", days);

  function handlePlusThree() {
    setDays(days + 1);
    setDays(days + 1);
    setDays(days + 1);
    alert(days);
  }

  return (
    <section>
      <h1>%%habit%%</h1>
      <p>%%daysDone%%: {days}</p>
      <button onClick={handlePlusThree}>+3</button>
    </section>
  );
}
