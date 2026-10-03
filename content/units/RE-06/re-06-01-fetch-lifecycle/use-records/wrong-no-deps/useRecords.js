import { useEffect, useState } from "react";
import { fetchTasks } from "./fixtureApi.js";

// The effect has no dependency array.
export function useRecords() {
  const [status, setStatus] = useState("loading");
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks()
      .then((tasks) => {
        setRecords(tasks);
        setStatus("success");
      })
      .catch((failure) => {
        setError(failure);
        setStatus("error");
      });
  });

  return { status, records, error };
}
