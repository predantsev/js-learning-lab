// Needs React 19.0.0 or newer: form actions, useActionState and useOptimistic first shipped in 19.0.0.
import { useActionState, useOptimistic, useState, version } from "react";
import { saveName, server } from "./server";

function HabitName({ id, initialName }) {
  const [name, setName] = useState(initialName);
  const [shownName, setShownName] = useOptimistic(name);
  const [error, renameAction, isPending] = useActionState(async (previousError, formData) => {
    const next = formData.get("name").trim();
    setShownName(next); // shown at once, only while this action runs
    try {
      setName(await saveName(id, next));
      return null;
    } catch {
      return "%%saveFailed%%";
    }
  }, null);

  console.log(`${id}: name="${name}" shown="${shownName}" pending=${isPending}`);

  return (
    <form action={renameAction}>
      <h2>
        {shownName}
        {isPending && <small> (%%saving%%)</small>}
      </h2>
      <label>
        %%newName%% <input name="name" defaultValue={name} />
      </label>{" "}
      <button>%%rename%%</button>
      {error !== null && <p role="alert">{error}</p>}
    </form>
  );
}

export default function App() {
  const [refuse, setRefuse] = useState(server.refuse);
  return (
    <div>
      <HabitName id="h-02" initialName="%%reading%%" />
      <label>
        <input
          type="checkbox"
          checked={refuse}
          onChange={(event) => {
            server.refuse = event.target.checked;
            setRefuse(event.target.checked);
          }}
        />{" "}
        %%serverRefuses%%
      </label>
      <p>
        <small>%%runningReact%% {version}</small>
      </p>
    </div>
  );
}
