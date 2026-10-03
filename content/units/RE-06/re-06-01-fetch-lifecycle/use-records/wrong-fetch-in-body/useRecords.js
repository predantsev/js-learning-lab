import { useState } from "react";
import { fetchTasks } from "./fixtureApi.js";

// The request starts right in the body: "the component runs only once anyway".
export function useRecords() {
  const [status, setStatus] = useState("loading");
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  fetchTasks()
    .then((tasks) => {
      setRecords(tasks);
      setStatus("success");
    })
    .catch((failure) => {
      setError(failure);
      setStatus("error");
    });

  return { status, records, error };
}
