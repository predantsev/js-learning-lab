// The request script of the /v1 records API. Start the server first (npm start in server/), then in another
// terminal, in server/:   node try-api.mjs   (or: node try-api.mjs http://127.0.0.1:4312 for another port)
// 1. a create with an Idempotency-Key, 2. the same create retried with the same key, 3. an invalid
// update, 4. page 1 sorted, 5. page 2 from its nextCursor, 6. "done today" twice with the same day.
// Every answer ends with its status.
const base = process.argv[2] ?? "http://127.0.0.1:4311";
const key = crypto.randomUUID();
const body = JSON.stringify({ name: "%%fixture1Name%% 2", frequency: "weekly" });
const json = { "content-type": "application/json" };

async function send(path, init = {}) {
  const response = await fetch(base + path, init);
  return { status: response.status, text: await response.text() };
}

console.log(`== 1. POST /v1/records (Idempotency-Key: ${key})`);
let answer = await send("/v1/records", { method: "POST", headers: { ...json, "idempotency-key": key }, body });
console.log(`${answer.text} → ${answer.status}`);
console.log("== 2. the same POST retried with the same key");
answer = await send("/v1/records", { method: "POST", headers: { ...json, "idempotency-key": key }, body });
console.log(`${answer.text} → ${answer.status}`);
console.log("== 3. PATCH /v1/records/h-01 with invalid fields");
answer = await send("/v1/records/h-01", { method: "PATCH", headers: json, body: JSON.stringify({ name: "", completions: ["2026-03-01", "2026-02-27"] }) });
console.log(`${answer.text} → ${answer.status}`);
console.log("== 4. GET /v1/records?sort=name&limit=3");
const page = await send("/v1/records?sort=name&limit=3");
console.log(page.text);
const cursor = JSON.parse(page.text).nextCursor;
console.log(`== 5. GET /v1/records?sort=name&limit=3&cursor=${cursor}`);
answer = await send(`/v1/records?sort=name&limit=3&cursor=${cursor}`);
console.log(`${answer.text} → ${answer.status}`);
console.log("== 6. POST /v1/records/h-03/completions twice with the same day");
for (let i = 0; i < 2; i++) {
  answer = await send("/v1/records/h-03/completions", { method: "POST", headers: json, body: JSON.stringify({ day: "2026-03-02" }) });
  console.log(`${answer.text} → ${answer.status}`);
}
