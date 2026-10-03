import { useEffect, useState } from "react";
import { completionFeed } from "./completionFeed.js";

export default function CompletionFeed() {
  const [completions, setCompletions] = useState([]);

  useEffect(() => {
    const add = (completion) => setCompletions((current) => [...current, completion]);
    completionFeed.on(add);
    return () => {
      completionFeed.off(add);
    };
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
