import { useEffect, useState } from "react";
import { fetchTasks } from "./fixtureApi.js";

// One state object: every change replaces the whole description of the request.
export function useRecords() {
  const [request, setRequest] = useState({ status: "loading", records: [], error: null });

  useEffect(() => {
    fetchTasks()
      .then((tasks) => setRequest({ status: "success", records: tasks, error: null }))
      .catch((error) => setRequest({ status: "error", records: [], error }));
  }, []);

  return request;
}
