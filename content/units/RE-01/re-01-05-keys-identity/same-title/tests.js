const rowOf = (id) => document.querySelector(`#root li[data-task="${id}"]`);
const keyWarnings = () => rawLogs().filter((entry) => entry.level === "error" && /key/.test(String(entry.args[0])));

test("React gives no key warning", async () => {
  await settle();
  expect(keyWarnings().map((entry) => String(entry.args[0]).slice(0, 60)), "key warnings in the console").toEqual([]);
});

test("a typed note stays with its task after the task above is deleted", async () => {
  await settle();
  expect(rowOf("t-07"), "the row of the task t-07").toBeTruthy();
  const note = rowOf("t-07").querySelector("input");
  await user.type(note, L.typed);
  await user.click(rowOf("t-01").querySelector("button"));
  await settle();
  expect(document.querySelectorAll("#root li"), "rows after deleting t-01").toHaveLength(2);
  expect(rowOf("t-07").querySelector("input").value, "the note in the row of t-07 after the delete").toBe(L.typed);
  expect(rowOf("t-02").querySelector("input").value, "the note in the row of t-02 after the delete").toBe("");
});
