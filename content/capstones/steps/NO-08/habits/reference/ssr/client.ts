// The client entry of the server-rendered list page: `npm run build:client` in server/ bundles it into
// server/public/client.js, which GET / of the records server loads. It reads the page's initial data from
// #initial-data — the very data the server rendered with — and hydrates #root with the same element: React
// attaches the handlers to the DOM nodes the server sent instead of drawing them again. No data of its own,
// no clock (the day is the server's `today` from the data), no locale of its own before hydration. A mismatch
// React recovers from (it renders that part again on the client) is reported with the page's request id, so
// the server log and the browser report meet.
import { hydrateRoot } from "react-dom/client";
import { clientElement } from "../ui/HabitListPage.ts";
import type { ListPageData } from "../ui/HabitListPage.ts";

const data = JSON.parse(document.getElementById("initial-data")?.textContent ?? "null") as ListPageData;

hydrateRoot(document.getElementById("root")!, clientElement(data), {
  onRecoverableError(error, errorInfo) {
    console.warn(JSON.stringify({ level: "warn", kind: "hydration", requestId: data.requestId, message: error instanceof Error ? error.message : String(error), componentStack: errorInfo.componentStack ?? "" }));
  },
});
console.log("hydrated");
