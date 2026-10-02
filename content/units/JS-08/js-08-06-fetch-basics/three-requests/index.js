// Fetches `url` and prints what came back: the address, status, ok and Content-Type.
async function show(url) {
  const response = await fetch(url);
  console.log(url, response.status, response.ok, response.headers.get("content-type"));
  return response;
}

const wishes = await show("./data/wishes.json");
const list = await wishes.json();
console.log("%%count%%", list.length, "—", list[0].name);

const missing = await show("./data/missing.json");

const notes = await show("./data/notes.txt");
console.log(await notes.text());

// The request side: /lab/echo answers with what it received from us.
const echo = await fetch("/lab/echo", { method: "GET", headers: { Accept: "application/json" } });
const seen = await echo.json();
console.log("%%serverSaw%%", seen.method, seen.headers.accept);
