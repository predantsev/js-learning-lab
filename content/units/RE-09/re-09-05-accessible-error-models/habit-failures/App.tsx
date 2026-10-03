import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { HabitBoundary } from "./HabitBoundary";
import { printA11yReport } from "./a11yReport";

// One typed model for every failure this screen knows about.
type AppError =
  | { kind: "field"; field: "name"; message: string }
  | { kind: "request"; message: string }
  | { kind: "response"; message: string }
  | { kind: "render"; message: string };

type ServerMode = "ok" | "reject" | "malformed";

// A fixture server: answers with the saved name, rejects, or sends a damaged answer.
function saveHabit(name: string, mode: ServerMode): Promise<unknown> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (mode === "reject") reject(new Error("503"));
      else resolve(mode === "malformed" ? { nme: name } : { name });
    }, 30),
  );
}

function HabitPreview({ name, broken }: { name: string; broken: boolean }) {
  if (broken) throw new Error("%%damaged%%");
  return <p>%%preview%% {name || "—"}</p>;
}

function HabitForm() {
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<AppError[]>([]);
  const [saved, setSaved] = useState("");
  const [broken, setBroken] = useState(false);
  const mode = useRef<ServerMode>("ok");
  const form = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim() === "") {
      setErrors([{ kind: "field", field: "name", message: "%%nameRequired%%" }]);
      return;
    }
    const current = mode.current;
    mode.current = "ok";
    try {
      const answer = await saveHabit(name.trim(), current);
      if (typeof answer === "object" && answer !== null && "name" in answer && typeof answer.name === "string") {
        setSaved(answer.name);
        setErrors([]);
      } else {
        setErrors([{ kind: "response", message: "%%badAnswer%%" }]);
      }
    } catch {
      setErrors([{ kind: "request", message: "%%saveFailed%%" }]);
    }
  }

  const fieldError = errors.find((error) => error.kind === "field");
  const problem = errors.find((error) => error.kind === "request" || error.kind === "response");

  return (
    <form ref={form} onSubmit={handleSubmit} noValidate>
      <label htmlFor="habit-name">%%nameLabel%%</label>{" "}
      <input id="habit-name" value={name} onChange={(event) => setName(event.target.value)} />
      {fieldError && <p style={{ color: "firebrick" }}>{fieldError.message}</p>}
      <HabitPreview name={name} broken={broken} />
      <p>
        <button type="submit">%%save%%</button>
      </p>
      {problem && <p style={{ color: "firebrick" }}>{problem.message}</p>}
      {saved && <p>%%saved%% {saved}</p>}
      <p>
        <button type="button" onClick={() => (mode.current = "reject")}>%%injectReject%%</button>{" "}
        <button type="button" onClick={() => (mode.current = "malformed")}>%%injectMalformed%%</button>{" "}
        <button type="button" onClick={() => setBroken(true)}>%%injectRender%%</button>
      </p>
      <p>
        <button type="button" onClick={() => form.current && printA11yReport(form.current)}>%%report%%</button>
      </p>
    </form>
  );
}

export default function App() {
  return (
    <main>
      <h2>%%heading%%</h2>
      <HabitBoundary>
        <HabitForm />
      </HabitBoundary>
    </main>
  );
}
