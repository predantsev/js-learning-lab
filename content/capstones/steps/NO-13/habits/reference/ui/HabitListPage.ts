// The list page that the server renders (server/src/page.ts, renderToString) and the browser hydrates
// (ssr/client.ts, hydrateRoot) — one component, one function that builds its element, so the two renders
// cannot drift apart. No JSX: Node runs this file as it is (type stripping), and Node does not read JSX.
// The props are the page's initial data: only public fields, the day the server counted on, and every value
// that must match to the character already computed by the server — each streak (streakOf for that day) and
// the day as text. The browser computes nothing from its own clock before it has hydrated. After hydration
// "done today" asks the server for the server's day (POST …/completions with `today` from the data) and then
// shows the server's new data (GET /list-data): the server records the day and counts the streaks.
import { createElement as h, useState } from "react";
import type { ReactElement } from "react";

export type PublicHabit = { id: string; name: string; completions: string[]; streak: number; doneToday: boolean };

export type ListPageData = { requestId: string; today: string; todayText: string; habits: PublicHabit[]; count: number; doneTodayCount: number };

function isPageData(value: unknown): value is ListPageData {
  const data = value as ListPageData;
  return typeof value === "object" && value !== null && Array.isArray(data.habits) && typeof data.today === "string" && typeof data.todayText === "string" && typeof data.count === "number" && typeof data.doneTodayCount === "number";
}

export function HabitListPage({ initial }: { initial: ListPageData }): ReactElement {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState("");

  async function markToday(habit: PublicHabit) {
    setStatus("");
    try {
      const changed = await fetch("/v1/records/" + encodeURIComponent(habit.id) + "/completions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day: data.today }),
      });
      if (!changed.ok) {
        throw new Error("POST " + changed.status);
      }
      const fresh: unknown = await (await fetch("/list-data")).json();
      if (!isPageData(fresh)) {
        throw new Error("the list data is damaged");
      }
      setData(fresh);
    } catch {
      setStatus("%%markFailedMessage%%".replace("{name}", habit.name));
    }
  }

  return h(
    "main",
    null,
    h("h1", null, "%%projectTitle%%"),
    h("p", null, `${data.todayText} · %%listTitle%%: ${data.count} · %%doneTodayMark%%: ${data.doneTodayCount}`),
    h(
      "ul",
      null,
      data.habits.map((habit) =>
        h(
          "li",
          { key: habit.id, className: "card", "data-id": habit.id },
          h("h3", null, habit.name),
          h("p", null, `%%streakLabel%%: ${habit.streak}`),
          h("p", null, `%%completionsLabel%%: ${habit.completions.length}`),
          habit.doneToday ? h("p", { className: "badge" }, "%%doneTodayMark%%") : null,
          h("button", { type: "button", disabled: habit.doneToday, "aria-label": `%%markTodayLabel%%: ${habit.name}`, onClick: () => markToday(habit) }, "%%markTodayLabel%%"),
        ),
      ),
    ),
    h("p", { role: "status" }, status),
  );
}

// The element both sides render: the server with renderToString, the browser with hydrateRoot.
export function clientElement(data: ListPageData): ReactElement {
  return h(HabitListPage, { initial: data });
}
