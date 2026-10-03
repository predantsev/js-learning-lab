import { useEffect, useState } from "react";

// Question 1: three updates in one click handler.
function WishVotes() {
  const [votes, setVotes] = useState(0);

  function handleVote() {
    setVotes(votes + 1);
    setVotes(votes + 1);
    setVotes(votes + 1);
    console.log("votes in the handler:", votes);
  }

  return <button onClick={handleVote}>%%votes%% {votes}</button>;
}

// Question 2: an interval created once, after the first render.
function HabitTicker() {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const id = setInterval(() => console.log(`tick: done = ${done}`), 1000);
    return () => clearInterval(id);
  }, []);

  return <button onClick={() => setDone(done + 1)}>%%done%% {done}</button>;
}

export default function App() {
  return (
    <main>
      <p>
        <WishVotes />
      </p>
      <p>
        <HabitTicker />
      </p>
    </main>
  );
}
