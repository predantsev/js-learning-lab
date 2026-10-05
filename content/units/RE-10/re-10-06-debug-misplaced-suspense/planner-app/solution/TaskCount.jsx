import { useEffect, useState } from "react";
import { loadOpenCount } from "./api";

export function TaskCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let ignore = false;
    loadOpenCount().then((value) => {
      if (!ignore) setCount(value);
    });
    return () => {
      ignore = true;
    };
  }, []);

  if (count === null) return <p role="status">%%counting%%</p>;
  return <p>%%openTasks%%: {count}</p>;
}
