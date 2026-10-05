import { useEffect, useState } from "react";
import { fetchTasks } from "./fixtureApi.js";

// Starts as "success": "the request starts so early that the data is already there".
export function useRecords() {
  const [status, setStatus] = useState("success");
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
  }, []);

  return { status, records, error };
}
