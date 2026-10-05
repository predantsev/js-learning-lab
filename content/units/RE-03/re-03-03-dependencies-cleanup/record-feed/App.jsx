import { useEffect, useState } from "react";
import { subscribe } from "./feed.js";

function RecordUpdates({ recordId }) {
  const [message, setMessage] = useState("%%waiting%%");

  useEffect(() => {
    const unsubscribe = subscribe(recordId, setMessage);
    return unsubscribe; // the cleanup: React calls it before the next run and on unmount
  }, [recordId]);

  return <p>{message}</p>;
}

export default function WishUpdates() {
  const [selectedId, setSelectedId] = useState("w-01");
  const [visible, setVisible] = useState(true);

  return (
    <section>
      {["w-01", "w-02", "w-03"].map((id) => (
        <button key={id} aria-pressed={selectedId === id} onClick={() => setSelectedId(id)}>
          {id}
        </button>
      ))}
      <button onClick={() => setVisible(!visible)}>{visible ? "%%hide%%" : "%%show%%"}</button>
      {visible && <RecordUpdates recordId={selectedId} />}
    </section>
  );
}
