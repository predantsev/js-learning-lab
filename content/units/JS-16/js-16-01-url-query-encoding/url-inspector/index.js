// Sends the same category to the lab echo server twice and prints what the server received.
const category = "%%homeGarden%%";

async function inspect(label, url) {
  const echo = await (await fetch(url)).json();
  console.log(label);
  console.log("  sent:", url.pathname + url.search + url.hash);
  console.log("  server received:", JSON.stringify(echo.query));
}

// 1. The value glued into the address as plain text.
const glued = new URL("/lab/echo?category=" + category + "&sort=price#w-02", location.href);
await inspect("%%gluedLabel%%", glued);

// 2. The same value set through searchParams, which encodes it.
const built = new URL("/lab/echo", location.href);
built.searchParams.set("category", category);
built.searchParams.set("sort", "price");
built.hash = "w-02";
await inspect("%%builtLabel%%", built);
