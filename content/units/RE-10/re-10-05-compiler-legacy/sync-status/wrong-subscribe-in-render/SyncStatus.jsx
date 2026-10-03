import { useState } from "react";
import { connection } from "./connection";

export function SyncStatus() {
  const [online, setOnline] = useState(connection.online);
  connection.subscribe((value) => setOnline(value));
  return <p role="status">{online ? "%%synced%%" : "%%offline%%"}</p>;
}
