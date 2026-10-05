// Tests of the server-rendered list page — `npm test` in server/: the document GET / sends, the initial data
// (an allowlist, HTML-safe), the markup against a render of the same element from that data (what hydration
// relies on), a render error, the page's data after a change, and the client bundle (nothing of the server
// in it). What a browser does while hydrating is checked by hand (docs/server.md, NO-13).
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { renderToString } from "react-dom/server";
import { createFileRepository, DATA_FILE_NAME } from "../src/fileRepository.ts";
import type { WishRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import { fallbackPage } from "../src/page.ts";
import { createRecordsServer } from "../src/server.ts";
import { clientElement } from "../../ui/WishListPage.ts";
import type { ListPageData } from "../../ui/WishListPage.ts";

const freshFolder = () => path.join(import.meta.dirname, "..", ".check", "ssr", randomUUID());

async function start(t: TestContext, folder = freshFolder()): Promise<{ base: string; repository: WishRepository; folder: string }> {
  const repository = createFileRepository(folder);
  await repository.seed(await loadFixtures());
  const server = createRecordsServer(repository, () => {});
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
  assert.match(markup, /data-id="w-01"/);
});

test("the markup is exactly what the same element renders from the page's own data", async (t) => {
  const { base } = await start(t);
  const { markup, json } = partsOf(await (await fetch(base + "/")).text());
  assert.equal(renderToString(clientElement(JSON.parse(json) as ListPageData)), markup);
});

test("the initial data is an allowlist: public fields only, the request id, no server setting", async (t) => {
  const { base, folder } = await start(t);
  const response = await fetch(base + "/", { headers: { "x-request-id": "page-check-0001" } });
  const html = await response.text();
  const data = JSON.parse(partsOf(html).json) as ListPageData;
  assert.equal(data.requestId, "page-check-0001");
  assert.equal(response.headers.get("x-request-id"), "page-check-0001");
  for (const wish of data.wishes) {
    assert.deepEqual(Object.keys(wish).toSorted(), ["acquired", "id", "name", "price", "priceText"]);
  }
  assert.ok(!html.includes(folder), "the data folder is not in the page");
  assert.ok(!html.includes("category"), "a field the page does not show is not sent");
});

test("a hostile name stays text: the data cannot close its <script>, and JSON.parse gives it back exactly", async (t) => {
  const { base, repository } = await start(t);
  const hostile = "</script><script>alert(1)</script>\u2028x";
  await repository.create(() => ({ id: "w-07", name: hostile, price: 10, acquired: false, category: null }));
  const html = await (await fetch(base + "/")).text();
  assert.equal(html.split("</script>").length - 1, 2, "only the two real </script> of the page");
  const { markup, json } = partsOf(html);
  assert.ok(!json.includes("<") && !json.includes("\u2028"));
  assert.equal((JSON.parse(json) as ListPageData).wishes.find((wish) => wish.id === "w-07")?.name, hostile);
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

test("GET /list-data is the page's data from the server's store, after a change too", async (t) => {
  const { base } = await start(t);
  const before = (await (await fetch(base + "/list-data")).json()) as ListPageData;
  const page = JSON.parse(partsOf(await (await fetch(base + "/")).text()).json) as ListPageData;
  assert.deepEqual({ ...before, requestId: "" }, { ...page, requestId: "" });
  await fetch(base + "/v1/records/w-01", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ acquired: true }) });
  const after = (await (await fetch(base + "/list-data")).json()) as ListPageData;
  assert.equal(after.wishes.find((wish) => wish.id === "w-01")?.acquired, true);
  assert.notEqual(after.wantedTotalText, before.wantedTotalText);
});

test("a client that formats the price itself renders other markup: that is the mismatch hydration reports", async (t) => {
  const { base } = await start(t);
  const { markup, json } = partsOf(await (await fetch(base + "/")).text());
  const data = JSON.parse(json) as ListPageData;
  const ownFormat = { ...data, wishes: data.wishes.map((wish) => ({ ...wish, priceText: wish.price === null ? wish.priceText : wish.price.toLocaleString(undefined, { style: "currency", currency: "UAH" }) })) };
  assert.notEqual(renderToString(clientElement(ownFormat)), markup);
});

test("the client bundle holds nothing of the server: no node: module, no store, no server file", async () => {
  const out = path.join(freshFolder(), "client.js");
  const built = spawnSync(process.execPath, [path.join(import.meta.dirname, "..", "scripts", "build-client.mjs"), out], { encoding: "utf8" });
  assert.equal(built.status, 0, built.stderr);
  const code = await readFile(out, "utf8");
  assert.match(code, /hydrateRoot/);
  assert.doesNotMatch(code, /from "node:|require\("node:|createFileRepository|DATA_DIR|server\/src/);
});
