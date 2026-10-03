import { useEffect, useState } from "react";
import { connection } from "./connection";

export function SyncStatus() {
  const [online, setOnline] = useState(() => connection.online);

  useEffect(() => {
    setOnline(connection.online);
    const stop = connection.subscribe(setOnline);
    return () => {
      stop();
    };
  }, []);

  return <p role="status">{online ? "%%synced%%" : "%%offline%%"}</p>;
}
