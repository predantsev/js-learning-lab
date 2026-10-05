// The course's stand-in for a static server that has already been rolled back: it serves release
// v0.1.0, while this tab's bundle comes from v0.2.0 and asks for the v0.2.0 name of the chunk.
const SERVED = {
  "DueToday-Bq81LxPe.js": () => import("./DueToday.jsx"),
};

export async function loadChunk(fileName) {
  await new Promise((resolve) => setTimeout(resolve, 300)); // the network
  const load = SERVED[fileName];
  console.log(`GET /assets/${fileName} → ${load ? "200" : "404"}`);
  if (!load) {
    throw new TypeError(`Failed to fetch dynamically imported module: http://localhost:4173/assets/${fileName}`);
  }
  return load();
}
