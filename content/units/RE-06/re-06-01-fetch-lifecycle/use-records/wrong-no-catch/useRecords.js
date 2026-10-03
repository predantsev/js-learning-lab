import { useEffect, useState } from "react";
import { fetchTasks } from "./fixtureApi.js";

// Only the happy path: a failed request is never turned into the error status.
export function useRecords() {
  const [status, setStatus] = useState("loading");
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchTasks().then((tasks) => {
      setRecords(tasks);
      setStatus("success");
    });
  }, []);

  return { status, records, error: null };
}
