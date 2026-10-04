// Tests of the server-rendered list page — `npm test` in server/: the document GET / sends, the initial data
// (an allowlist with the server's day, HTML-safe), the markup against a render of the same element from that
// data (what hydration relies on), a render error, the page's data after a change, and the client bundle
// (nothing of the server in it). The server counts for a fixed day (TODAY), as `TODAY=2026-03-02 npm start`
// does. What a browser does while hydrating is checked by hand (docs/server.md, NO-13).
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { renderToString } from "react-dom/server";
import { countDueTasks } from "../../domain/tasks.ts";
import { DEFAULT_ALLOWED_ORIGINS } from "../src/config.ts";
import { createFileRepository, DATA_FILE_NAME } from "../src/fileRepository.ts";
import type { TaskRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import { fallbackPage } from "../src/page.ts";
import { createRecordsServer } from "../src/server.ts";
import { clientElement, countDue } from "../../ui/TaskListPage.ts";
import type { ListPageData } from "../../ui/TaskListPage.ts";

// The server's day (TODAY): t-01 and t-02 are due on or before it, t-05 (2026-03-10) is not yet.
const TODAY = "2026-03-02";

const freshFolder = () => path.join(import.meta.dirname, "..", ".check", "ssr", randomUUID());

async function start(t: TestContext, folder = freshFolder()): Promise<{ base: string; repository: TaskRepository; folder: string }> {
  const repository = createFileRepository(folder);
  await repository.seed(await loadFixtures());
  const server = createRecordsServer(repository, () => {}, {}, {}, DEFAULT_ALLOWED_ORIGINS, {}, TODAY);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  return { base: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, repository: repository, folder: folder };
}

// The parts of the document: the markup of #root and the text of #initial-data.
function partsOf(html: string): { markup: string; json: string } {
  const root = /<div id="root">([\s\S]*?)<\/div>\n<script id="initial-data" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
  assert.ok(root, "the page has #root followed by #initial-data");
  return { markup: root[1], json: root[2] };
}

test("GET / sends one complete document: doctype, charset, #root with the markup, the data and the client entry", async (t) => {
  const { base } = await start(t);
  const response = await fetch(base + "/");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  const html = await response.text();
  assert.ok(html.startsWith("<!doctype html>"));
  assert.match(html, /<meta charset="utf-8">/);
  assert.match(html, /<script type="module" src="\/client.js"><\/script>/);
  const { markup } = partsOf(html);
  assert.ok(markup.startsWith("<main>") && markup.endsWith("</main>"), "nothing but React's markup in #root");
  assert.match(markup, /data-id="t-01"/);
});

test("the markup is exactly what the same element renders from the page's own data", async (t) => {
  const { base } = await start(t);
  const { markup, json } = partsOf(await (await fetch(base + "/")).text());
  assert.equal(renderToString(clientElement(JSON.parse(json) as ListPageData)), markup);
});

test("the initial data is an allowlist: public fields only, the server's day, the request id, no server setting", async (t) => {
  const { base, folder } = await start(t);
  const response = await fetch(base + "/", { headers: { "x-request-id": "page-check-0001" } });
  const html = await response.text();
  const data = JSON.parse(partsOf(html).json) as ListPageData;
  assert.equal(data.requestId, "page-check-0001");
  assert.equal(response.headers.get("x-request-id"), "page-check-0001");
  assert.equal(data.today, TODAY, "the day is the server's TODAY");
  assert.deepEqual(Object.keys(data).toSorted(), ["requestId", "tasks", "today", "todayText"]);
  for (const task of data.tasks) {
    assert.deepEqual(Object.keys(task).toSorted(), ["done", "dueDate", "dueText", "id", "title"]);
  }
  assert.ok(!html.includes(folder), "the data folder is not in the page");
  assert.ok(!html.includes("priority"), "a field the page does not show is not sent");
});

test("a hostile title stays text: the data cannot close its <script>, and JSON.parse gives it back exactly", async (t) => {
  const { base, repository } = await start(t);
  const hostile = "</script><script>alert(1)</script>\u2028x";
  await repository.create(() => ({ id: "t-07", title: hostile, dueDate: null, done: false, priority: "normal" }));
  const html = await (await fetch(base + "/")).text();
  assert.equal(html.split("</script>").length - 1, 2, "only the two real </script> of the page");
  const { markup, json } = partsOf(html);
  assert.ok(!json.includes("<") && !json.includes("\u2028"));
  assert.equal((JSON.parse(json) as ListPageData).tasks.find((task) => task.id === "t-07")?.title, hostile);
  assert.match(markup, /&lt;\/script&gt;&lt;script&gt;alert\(1\)/);
});

test("a render error answers a 500 page with only the request id, and the server goes on serving", async (t) => {
  const { base, folder } = await start(t);
  const file = path.join(folder, DATA_FILE_NAME);
  const good = await readFile(file, "utf8");
  await writeFile(file, "{ damaged");
  const failed = await fetch(base + "/", { headers: { "x-request-id": "page-check-0500" } });
  assert.equal(failed.status, 500);
  assert.equal(failed.headers.get("content-type"), "text/html; charset=utf-8");
  // The whole page is the fixed fallback with the request id: no error name, message or stack in it.
  assert.equal(await failed.text(), fallbackPage("page-check-0500"));
  await writeFile(file, good);
  assert.equal((await fetch(base + "/")).status, 200);
});

test("GET /list-data is the page's data from the server's store, after a change too, and counts as the domain does", async (t) => {
  const { base, repository } = await start(t);
  const before = (await (await fetch(base + "/list-data")).json()) as ListPageData;
  const page = JSON.parse(partsOf(await (await fetch(base + "/")).text()).json) as ListPageData;
  assert.deepEqual({ ...before, requestId: "" }, { ...page, requestId: "" });
  assert.equal(countDue(before.tasks, before.today), countDueTasks(await repository.list(), TODAY));
  assert.equal(countDue(before.tasks, before.today), 2);
  await fetch(base + "/v1/records/t-01", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ done: true }) });
  const after = (await (await fetch(base + "/list-data")).json()) as ListPageData;
  assert.equal(after.tasks.find((task) => task.id === "t-01")?.done, true);
  assert.equal(after.today, TODAY);
  assert.equal(countDue(after.tasks, after.today), countDueTasks(await repository.list(), TODAY));
  assert.equal(countDue(after.tasks, after.today), 1);
});

test("a client that takes the day from its own clock renders other markup: that is the mismatch hydration reports", async (t) => {
  const { base } = await start(t);
  const { markup, json } = partsOf(await (await fetch(base + "/")).text());
  const data = JSON.parse(json) as ListPageData;
  // The browser's clock on another day than the server's TODAY (here: the day of this step's rehearsal).
  const ownDay = { ...data, today: "2026-10-05" };
  assert.notEqual(renderToString(clientElement(ownDay)), markup);
});

test("the client bundle holds nothing of the server: no node: module, no store, no server file", async () => {
  const out = path.join(freshFolder(), "client.js");
  const built = spawnSync(process.execPath, [path.join(import.meta.dirname, "..", "scripts", "build-client.mjs"), out], { encoding: "utf8" });
  assert.equal(built.status, 0, built.stderr);
  const code = await readFile(out, "utf8");
  assert.match(code, /hydrateRoot/);
  assert.doesNotMatch(code, /from "node:|require\("node:|createFileRepository|DATA_DIR|server\/src/);
});
