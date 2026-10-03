import { useEffect, useState } from "react";
import { connect } from "./channel.js";

const LISTS = [
  { id: "home", label: "%%home%%" },
  { id: "work", label: "%%work%%" },
];

let connectedOnce = false;

function ListSync({ listId }) {
  useEffect(() => {
    // "Fixes" the double run with a flag instead of a cleanup.
    if (connectedOnce) return;
    connectedOnce = true;
    connect(listId);
  }, [listId]);

  return <p>%%syncing%% {listId}</p>;
}

export default function TaskLists() {
  const [listId, setListId] = useState("home");
  const [syncOn, setSyncOn] = useState(true);

  return (
    <section>
      {LISTS.map((list) => (
        <button key={list.id} aria-pressed={listId === list.id} onClick={() => setListId(list.id)}>
          {list.label}
        </button>
      ))}
      <button onClick={() => setSyncOn(!syncOn)}>{syncOn ? "%%turnOff%%" : "%%turnOn%%"}</button>
      {syncOn && <ListSync listId={listId} />}
    </section>
  );
}
