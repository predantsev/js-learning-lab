// Tests of src/devConfig.ts, src/fetchWithRetry.ts and src/recordsSource.ts against the course's real mock
// service (tools/mock-service.mjs), started here on a free port of 127.0.0.1 and stopped at the end of
// every test. Node.js has the same fetch and AbortController as the app, so these are the app's own
// functions over a real network connection — only the device is missing.
import { test, expect } from "./testing.js";
import { createMockService } from "../tools/mock-service.mjs";
import { mockBaseUrl } from "../src/devConfig.ts";
import { fetchWithRetry } from "../src/fetchWithRetry.ts";
import { loadFromService, recordsUrl } from "../src/recordsSource.ts";
import { countDueTasks } from "../domain/tasks.ts";

const BUNDLED = [{ id: "t-04", title: "%%fixture4Name%%", dueDate: "2026-02-27", done: true, priority: "high" }];

// Starts the mock service, runs the body with its address and the list of requests it saw, stops it.
async function withService(body) {
  const seen = [];
  const server = createMockService({ log: (line) => seen.push(line) });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await body("http://127.0.0.1:" + server.address().port, seen);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

const quick = { timeoutMs: 300, baseDelayMs: 10 };
const request = (baseUrl, rehearsal, extra = {}) => ({ baseUrl: baseUrl, lang: "%%htmlLang%%", rehearsal: rehearsal, fetchFn: fetch, ...quick, ...extra });

test("the address of the mock service comes from the target, never from a request", () => {
  expect(mockBaseUrl("android-emulator"), "Android emulator").toBe("http://10.0.2.2:7310");
  expect(mockBaseUrl("ios-simulator"), "iOS simulator").toBe("http://127.0.0.1:7310");
  expect(mockBaseUrl("android-usb"), "Android phone on USB").toBe("http://127.0.0.1:7310");
  expect(recordsUrl("http://h:1", "en", "fail=2&key=k"), "the records address").toBe("http://h:1/records/planner?lang=en&fail=2&key=k");
});

test("the records of the service load, pass the contract and give the derived values", async () => {
  await withService(async (baseUrl) => {
    const outcome = await loadFromService(request(baseUrl, ""), BUNDLED);
    expect(outcome.source, "source").toBe("service");
    expect(outcome.records.length, "records").toBe(6);
    expect(countDueTasks(outcome.records, "2026-03-01"), "due on 2026-03-01").toBe(1);
  expect(countDueTasks(outcome.records, "2026-03-02"), "due on 2026-03-02").toBe(2);
  });
});

test("two failures and a success: the third attempt answers", async () => {
  await withService(async (baseUrl, seen) => {
    const outcome = await loadFromService(request(baseUrl, "fail=2&key=t1"), BUNDLED);
    expect(outcome.source, "source").toBe("service");
    expect(seen.length, "requests").toBe(3);
  });
});

test("five failures: at most three attempts, then no data and no derived value", async () => {
  await withService(async (baseUrl, seen) => {
    const outcome = await loadFromService(request(baseUrl, "fail=5&key=t2"), BUNDLED);
    expect(outcome, "outcome").toEqual({ source: "none", failure: "server", status: 503 });
    expect(seen.length, "requests").toBe(3);
  });
});

test("a service that never answers: a timeout on each of three attempts", async () => {
  await withService(async (baseUrl, seen) => {
    const outcome = await loadFromService(request(baseUrl, "hang=1", { timeoutMs: 100 }), BUNDLED);
    expect(outcome, "outcome").toEqual({ source: "none", failure: "timeout" });
    expect(seen.length, "requests").toBe(3);
  });
});

test("an answer of the wrong shape and a stopped service fall back to the bundled records", async () => {
  await withService(async (baseUrl) => {
    const invalid = await loadFromService(request(baseUrl, "invalid=1"), BUNDLED);
    expect(invalid, "invalid").toEqual({ source: "bundled", records: BUNDLED, failure: "invalid" });
  });
  const offline = await loadFromService(request("http://127.0.0.1:9", ""), BUNDLED);
  expect(offline, "nothing listens on port 9").toEqual({ source: "bundled", records: BUNDLED, failure: "offline" });
});

test("an abort stops the attempts at once and rejects with an AbortError", async () => {
  await withService(async (baseUrl, seen) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 50);
    const started = Date.now();
    let name = "no error";
    try {
      await fetchWithRetry(recordsUrl(baseUrl, "en", "hang=1"), { fetchFn: fetch, signal: controller.signal, timeoutMs: 1000, baseDelayMs: 10 });
    } catch (error) {
      name = error.name;
    }
    expect(name, "the error").toBe("AbortError");
    expect(Date.now() - started < 500, "stopped long before the 1000 ms timeout").toBe(true);
    expect(seen.length, "requests").toBe(1);
  });
});
