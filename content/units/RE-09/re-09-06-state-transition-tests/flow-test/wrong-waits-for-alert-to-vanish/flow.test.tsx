import { test, expect } from "./testing";
import { renderWithApi } from "./testUtils";
import type { Task, TasksApi } from "./tasksApi";

// A test API that answers like the server, after a short delay.
function okApi(): TasksApi {
  let next = 1;
  return {
    createTask(title: string): Promise<Task> {
      return new Promise((resolve) => setTimeout(() => resolve({ id: `t-${next++}`, title }), 20));
    },
  };
}

test("%%tCreate%%", async () => {
  const view = renderWithApi(okApi());
  try {
    await view.type("%%newTask%%", "%%bread%%");
    await view.press("%%add%%");
    await view.waitFor(() => view.items().length === 1);
    expect(view.items()).toEqual(["%%bread%%"]);
    expect(view.alert()).toBe(null);
  } finally {
    view.unmount();
  }
});

// Plays planned answers in order: "fail" rejects, "ok" resolves.
function scriptedApi(plan: ("ok" | "fail")[]): TasksApi {
  const answers = [...plan];
  return {
    createTask(title) {
      const answer = answers.shift() ?? "ok";
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (answer === "fail") reject(new Error("server down"));
          else resolve({ id: "t-new", title });
        }, 10);
      });
    },
  };
}

test("%%tFlow%%", async () => {
  const view = renderWithApi(scriptedApi(["fail", "ok"]));
  try {
    await view.type("%%newTask%%", "%%bread%%");
    await view.press("%%add%%");
    await view.waitFor(() => view.alert() === "%%createFailed%%");
    expect(view.items().length).toBe(0);
    await view.press("%%retry%%");
    await view.waitFor(() => view.alert() === null);
    expect(view.items()).toEqual(["%%bread%%"]);
  } finally {
    view.unmount();
  }
});
