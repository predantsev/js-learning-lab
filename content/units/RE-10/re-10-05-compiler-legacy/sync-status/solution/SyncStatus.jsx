import { useEffect, useState } from "react";
import { connection } from "./connection";

export function SyncStatus() {
  const [online, setOnline] = useState(connection.online);

  useEffect(() => {
    const unsubscribe = connection.subscribe((value) => setOnline(value));
    return unsubscribe;
  }, []);

  return <p role="status">{online ? "%%synced%%" : "%%offline%%"}</p>;
}
