import { useEffect, useState } from "react";
import { fetchTasks } from "./fixtureApi.js";

// Loads the tasks and describes the request:
// status: "loading" | "success" | "error", records: the tasks (an array), error: an Error or null.
export function useRecords() {
  const [status, setStatus] = useState("loading");
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const tasks = await fetchTasks();
        setRecords(tasks);
        setStatus("success");
      } catch (failure) {
        setError(failure);
        setStatus("error");
      }
    }
    load();
  }, []);

  return { status, records, error };
}
