// The list page that the server renders (server/src/page.ts, renderToString) and the browser hydrates
// (ssr/client.ts, hydrateRoot) — one component, one function that builds its element, so the two renders
// cannot drift apart. No JSX: Node runs this file as it is (type stripping), and Node does not read JSX.
// The props are the page's initial data: only public fields, and every text that must match to the
// character (a price as money) already formatted by the server — the browser formats nothing before it has
// hydrated. After hydration the toggle asks the server (PATCH) and then shows the server's new data
// (GET /list-data): the server decides `acquired` and computes the totals.
import { createElement as h, useState } from "react";
import type { ReactElement } from "react";

export type PublicWish = { id: string; name: string; price: number | null; priceText: string; acquired: boolean };

export type ListPageData = { requestId: string; wishes: PublicWish[]; count: number; wantedTotalText: string };

function isPageData(value: unknown): value is ListPageData {
  const data = value as ListPageData;
  return typeof value === "object" && value !== null && Array.isArray(data.wishes) && typeof data.count === "number" && typeof data.wantedTotalText === "string";
}

export function WishListPage({ initial }: { initial: ListPageData }): ReactElement {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState("");

  async function toggle(wish: PublicWish) {
    setStatus("");
    try {
      const changed = await fetch("/v1/records/" + encodeURIComponent(wish.id), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ acquired: !wish.acquired }),
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
      setStatus("%%toggleFailedMessage%%".replace("{name}", wish.name));
    }
  }

  return h(
    "main",
    null,
    h("h1", null, "%%projectTitle%%"),
    h("p", null, `%%summaryCount%%: ${data.count} · %%summaryWantedTotal%%: ${data.wantedTotalText}`),
    h(
      "ul",
      null,
      data.wishes.map((wish) => {
        const label = wish.acquired ? "%%markWantedLabel%%" : "%%markAcquiredLabel%%";
        return h(
          "li",
          { key: wish.id, className: "card", "data-id": wish.id },
          h("h3", null, wish.name),
          h("p", null, `%%valueLabel%%: ${wish.priceText}`),
          wish.acquired ? h("p", { className: "badge" }, "%%acquiredMark%%") : null,
          h("button", { type: "button", "aria-label": `${label}: ${wish.name}`, onClick: () => toggle(wish) }, label),
        );
      }),
    ),
    h("p", { role: "status" }, status),
  );
}

// The element both sides render: the server with renderToString, the browser with hydrateRoot.
export function clientElement(data: ListPageData): ReactElement {
  return h(WishListPage, { initial: data });
}
