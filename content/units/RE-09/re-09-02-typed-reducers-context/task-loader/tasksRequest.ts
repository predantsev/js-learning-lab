export type Task = { readonly id: string; title: string; done: boolean };

// One request, four situations. Each status carries only the fields that exist in it.
export type TasksState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; tasks: Task[] }
  | { status: "failure"; message: string };

export type TasksAction =
  | { type: "started" }
  | { type: "succeeded"; tasks: Task[] }
  | { type: "failed"; message: string };

export function tasksReducer(state: TasksState, action: TasksAction): TasksState {
  switch (action.type) {
    case "started":
      // A new request starts from idle, after a success (refresh) or after a failure.
      if (state.status === "loading") return state;
      return { status: "loading" };
    case "succeeded":
      // An answer means something only while a request is running.
      if (state.status !== "loading") return state;
      return { status: "success", tasks: action.tasks };
    case "failed":
      if (state.status !== "loading") return state;
      return { status: "failure", message: action.message };
    default: {
      const unhandled: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`);
    }
  }
}

// Wraps the reducer and prints every transition: an action that changes nothing is "ignored".
export function loggedReducer(state: TasksState, action: TasksAction): TasksState {
  const next = tasksReducer(state, action);
  console.log(next === state ? `${state.status} + ${action.type} → %%ignored%%` : `${state.status} + ${action.type} → ${next.status}`);
  return next;
}
