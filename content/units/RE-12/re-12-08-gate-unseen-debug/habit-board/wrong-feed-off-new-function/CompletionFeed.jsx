import { useEffect, useState } from "react";
import { completionFeed } from "./completionFeed.js";

export default function CompletionFeed() {
  const [completions, setCompletions] = useState([]);

  // Returns a cleanup, but off() gets a new function, not the one on() registered: nothing is removed.
  useEffect(() => {
    completionFeed.on((completion) => setCompletions((current) => [...current, completion]));
    return () => completionFeed.off((completion) => setCompletions((current) => [...current, completion]));
  }, []);

  return (
    <section>
      <h2>%%feedTitle%%</h2>
      <ul aria-label="%%feedTitle%%">
        {completions.map((completion, index) => (
          <li key={`${completion.id}-${index}`}>
            {completion.habit} · {completion.day}
          </li>
        ))}
      </ul>
    </section>
  );
}
