import { useState } from "react";
import { connection } from "./connection";

export function SyncStatus() {
  const [online] = useState(connection.online);
  return <p role="status">{online ? "%%synced%%" : "%%offline%%"}</p>;
}
