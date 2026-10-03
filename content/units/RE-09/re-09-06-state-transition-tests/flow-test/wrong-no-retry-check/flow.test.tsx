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

// The first call rejects like a server that is down; every later call succeeds.
function failsOnceApi(): TasksApi {
  let calls = 0;
  return {
    createTask(title: string): Promise<Task> {
      calls += 1;
      const attempt = calls;
      return new Promise((resolve, reject) =>
        setTimeout(() => (attempt === 1 ? reject(new Error("503")) : resolve({ id: `t-${attempt}`, title })), 20),
      );
    },
  };
}

test("%%tFlow%%", async () => {
  const view = renderWithApi(failsOnceApi());
  try {
    await view.type("%%newTask%%", "%%bread%%");
    await view.press("%%add%%");
    await view.waitFor(() => view.alert() !== null);
    expect(view.alert()).toBe("%%createFailed%%");
    expect(view.items()).toEqual([]);

    await view.press("%%retry%%");
  } finally {
    view.unmount();
  }
});
