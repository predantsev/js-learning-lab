// The list page that the server renders (server/src/page.ts, renderToString) and the browser hydrates
// (ssr/client.ts, hydrateRoot) — one component, one function that builds its element, so the two renders
// cannot drift apart. No JSX: Node runs this file as it is (type stripping), and Node does not read JSX.
// The props are the page's initial data: only public fields, the day the server counts for (`today`), and
// every text that must match to the character (a date in words) already formatted by the server — the
// browser formats nothing and reads no clock before it has hydrated. The due count is computed here, from
// `today` of the data, so both renders count for the same day. After hydration the toggle asks the server
// (PATCH) and then shows the server's new data (GET /list-data): the server decides `done` and the day.
import { createElement as h, useState } from "react";
import type { ReactElement } from "react";

export type PublicTask = { id: string; title: string; dueDate: string | null; dueText: string; done: boolean };

export type ListPageData = { requestId: string; today: string; todayText: string; tasks: PublicTask[] };

function isPageData(value: unknown): value is ListPageData {
  const data = value as ListPageData;
  return typeof value === "object" && value !== null && Array.isArray(data.tasks) && typeof data.today === "string" && typeof data.todayText === "string";
}

// The rule of countDueTasks (domain/tasks.ts): pending, with a due date, on or before the day. The day
// is "YYYY-MM-DD" text, so comparing the text compares the dates.
export function countDue(tasks: readonly PublicTask[], day: string): number {
  return tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate.localeCompare(day) <= 0).length;
}

export function TaskListPage({ initial }: { initial: ListPageData }): ReactElement {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState("");

  async function toggle(task: PublicTask) {
    setStatus("");
    try {
      const changed = await fetch("/v1/records/" + encodeURIComponent(task.id), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ done: !task.done }),
      });
      if (!changed.ok) {
        throw new Error("PATCH " + changed.status);
      }
      const fresh: unknown = await (await fetch("/list-data")).json();
      if (!isPageData(fresh)) {
        throw new Error("the list data is damaged");
      }
      setData(fresh);
    } catch {
      setStatus("%%toggleFailedMessage%%".replace("{name}", task.title));
    }
  }

  return h(
    "main",
    null,
    h("h1", null, "%%projectTitle%%"),
    h("p", null, `%%dueSummary%% ${data.todayText}: ${countDue(data.tasks, data.today)}`),
    h(
      "ul",
      null,
      data.tasks.map((task) => {
        const label = task.done ? "%%markPendingLabel%%" : "%%markDoneLabel%%";
        return h(
          "li",
          { key: task.id, className: "card", "data-id": task.id },
          h("h3", null, task.title),
          h("p", null, `%%valueLabel%%: ${task.dueText}`),
          task.done ? h("p", { className: "badge" }, "%%doneMark%%") : null,
          h("button", { type: "button", "aria-label": `${label}: ${task.title}`, onClick: () => toggle(task) }, label),
        );
      }),
    ),
    h("p", { role: "status" }, status),
  );
}

// The element both sides render: the server with renderToString, the browser with hydrateRoot.
export function clientElement(data: ListPageData): ReactElement {
  return h(TaskListPage, { initial: data });
}
