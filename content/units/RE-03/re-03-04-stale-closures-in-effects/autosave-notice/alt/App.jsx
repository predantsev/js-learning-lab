import { useEffect, useEffectEvent, useState } from "react";
import { saveDraft } from "./drafts.js";

export default function TaskDraft() {
  const [title, setTitle] = useState("%%initialTitle%%");
  const [notice, setNotice] = useState("%%notSavedYet%%");

  // Autosave every 400 ms: the timer must save the title the field shows NOW,
  // and it must not restart on every keystroke.
  const autosave = useEffectEvent(() => {
    const latest = title;
    saveDraft(latest);
    setNotice(`%%savedPrefix%% ${latest}`);
  });

  useEffect(() => {
    const timer = setInterval(autosave, 400);
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <label>
        %%titleLabel%% <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <p>{notice}</p>
    </form>
  );
}
