import { test, expect } from "./testing.js";
import { loadTasks } from "./tasks-api.js";

// A fake fetch: it ignores the address and always answers with this fixture.
async function fakeFetch() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      items: [
        { id: "t-01", title: "%%t01%%", done: false },
        { id: "t-04", title: "%%t04%%", done: true },
      ],
    }),
  };
}

test("%%tFake%%", async () => {
  const result = await loadTasks(fakeFetch);
  expect(result.state, "%%mState%%").toBe("ready");
  expect(result.tasks.map((task) => task.id), "%%mIds%%").toEqual(["t-01", "t-04"]);
});

test("%%tReal%%", async () => {
  const result = await loadTasks(); // the real fetch, the real lab server
  expect(result.state, "%%mState%%").toBe("ready");
  expect(result.tasks.length > 0, "%%mNotEmpty%%").toBe(true);
  for (const task of result.tasks) {
    expect(typeof task.title, `%%mTitle%% ${task.id}`).toBe("string");
  }
});
