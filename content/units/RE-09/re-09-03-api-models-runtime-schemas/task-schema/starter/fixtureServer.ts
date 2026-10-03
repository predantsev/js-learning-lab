// A fixture server for the planner API. Read-only. The checks put other answers here.
const answers = {
  list: `[
    { "id": "t-01", "title": "%%plants%%", "due_date": "2026-03-02", "is_done": false, "priority": "normal" },
    { "id": "t-02", "title": "%%library%%", "due_date": "2026-03-01", "is_done": false, "priority": "high" },
    { "id": "t-03", "title": "%%grandma%%", "due_date": null, "is_done": false, "priority": "urgent" }
  ]`,
  detail: `{ "id": "t-02", "title": "%%library%%", "due_date": "2026-03-01", "is_done": false, "priority": "high" }`,
};

export function setAnswer(kind: "list" | "detail", jsonText: string): void {
  answers[kind] = jsonText;
}

// Like response.json(): after 30 ms, the parsed body. Its type is honest: nobody knows what is inside.
export function getJson(kind: "list" | "detail"): Promise<unknown> {
  return new Promise((resolve) => setTimeout(() => resolve(JSON.parse(answers[kind])), 30));
}
