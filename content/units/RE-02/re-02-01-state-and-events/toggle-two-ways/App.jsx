import { useState } from "react";

// A plain variable: it is created anew every time React calls the function.
function PlainToggle() {
  let done = false;
  console.log("render PlainToggle: done =", done);

  function handleClick() {
    done = !done;
    console.log("click PlainToggle: done =", done);
  }

  return (
    <p>
      %%plainLabel%%: {done ? "%%done%%" : "%%pending%%"}{" "}
      <button onClick={handleClick}>%%toggle%%</button>
    </p>
  );
}

// A state variable: React keeps its value between renders.
function StateToggle() {
  const [done, setDone] = useState(false);
  console.log("render StateToggle: done =", done);

  function handleClick() {
    console.log("click StateToggle: done =", done);
    setDone(!done);
  }

  return (
    <p>
      %%stateLabel%%: {done ? "%%done%%" : "%%pending%%"}{" "}
      <button onClick={handleClick}>%%toggle%%</button>
    </p>
  );
}

export default function App() {
  return (
    <main>
      <h1>%%task%%</h1>
      <PlainToggle />
      <StateToggle />
    </main>
  );
}
