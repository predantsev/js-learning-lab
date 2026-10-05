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

test("%%tFlow%%", async () => {
  const view = renderWithApi(okApi());
  try {
    await view.type("%%newTask%%", "%%bread%%");
    await view.press("%%add%%");
    await view.waitFor(() => view.items().length === 1);
    expect(view.alert()).toBe(null);
  } finally {
    view.unmount();
  }
});
