import { useState } from "react";
import { connect } from "./channel.js";

const LISTS = [
  { id: "home", label: "%%home%%" },
  { id: "work", label: "%%work%%" },
];

function ListSync({ listId }) {
  // TODO: while this component is on the screen, keep exactly one connection open
  // to the list listId (connect(listId) returns an object with disconnect()).

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
