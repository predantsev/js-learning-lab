import { Profiler, useEffect, useRef, useState } from "react";
import { TaskList } from "./TaskList";

// The Profiler calls this after every commit in which TaskList rendered.
function logListRender(id, phase, actualDuration) {
  console.log(`TaskList: ${Math.round(actualDuration)} ms`);
}

export default function App() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const keyTime = useRef(0);

  // Runs after the field's new text has been committed to the screen.
  useEffect(() => {
    if (keyTime.current !== 0) console.log(`%%keyToScreen%%: ${Math.round(performance.now() - keyTime.current)} ms`);
  }, [text]);

  function handleChange(event) {
    keyTime.current = performance.now();
    setText(event.target.value);
    setQuery(event.target.value);
  }

  return (
    <div>
      <h1>%%tasks%%</h1>
      <label>
        %%search%% <input value={text} onChange={handleChange} />
      </label>
      <Profiler id="TaskList" onRender={logListRender}>
        <TaskList query={query} />
      </Profiler>
    </div>
  );
}
