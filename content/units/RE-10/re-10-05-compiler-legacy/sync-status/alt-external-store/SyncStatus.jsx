import { useSyncExternalStore } from "react";
import { connection } from "./connection";

// React's own hook for reading an outside store: it subscribes and unsubscribes by itself.
export function SyncStatus() {
  const online = useSyncExternalStore(connection.subscribe, () => connection.online);
  return <p role="status">{online ? "%%synced%%" : "%%offline%%"}</p>;
}
