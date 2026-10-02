// Four exchanges with the lab fixture server and one with a page that plays a fallback page.
await fetch("/lab/wishlist/reset", { method: "POST" }); // start from the original fixtures

async function exchange(method, url) {
  const response = await fetch(url, { method });
  console.log(`${method} ${url.split("?")[0]} → ${response.status}`);
  console.log("  ok:", response.ok, "| Content-Type:", response.headers.get("content-type"));
  return response;
}

await exchange("GET", "/lab/wishlist/items/w-02?lang=%%lang%%");
await exchange("GET", "/lab/wishlist/items/w-99?lang=%%lang%%");
await exchange("POST", "/lab/wishlist/items/w-02?lang=%%lang%%");
const page = await exchange("GET", "./app/index.html");

// What the server saw in the request headers.
const echo = await (await fetch("/lab/echo", { headers: { Accept: "application/json" } })).json();
console.log("%%serverSawAccept%%", echo.headers.accept);
