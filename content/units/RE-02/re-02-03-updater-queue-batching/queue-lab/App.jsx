import { useState } from "react";

export default function CompletionCounter() {
  const [count, setCount] = useState(0);
  console.log("render: count =", count);

  function handleThreeUpdaters() {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    setCount((c) => c + 1);
  }

  function handleFiveThenOne() {
    setCount(5);
    setCount((c) => c + 1);
  }

  return (
    <section>
      <h1>%%habit%%</h1>
      <p>%%completions%%: {count}</p>
      <button onClick={handleThreeUpdaters}>%%threeUpdaters%%</button>{" "}
      <button onClick={handleFiveThenOne}>%%fiveThenOne%%</button>
    </section>
  );
}
