// The course's stand-in for a static server with two release folders. The sandbox cannot serve
// real releases, so loadChunk() looks a hashed file name up in the release that is current right
// now — the way a real server looks in the folder it currently serves.
const RELEASES = {
  "v0.1.0": { "Stats-DZOOMpaV.js": () => import("./releases/v010/Stats.jsx") },
  "v0.2.0": { "Stats-DTm_fCmj.js": () => import("./releases/v020/Stats.jsx") },
};

export const server = { current: "v0.2.0" };

export function serveRelease(name) {
  server.current = name;
  console.log(`%%nowServing%% ${name}`);
}

export async function loadChunk(fileName) {
  await new Promise((resolve) => setTimeout(resolve, 300)); // the network
  const load = RELEASES[server.current][fileName];
  console.log(`GET /assets/${fileName} → ${load ? "200" : "404"} (${server.current})`);
  if (!load) {
    // The same error Chrome gives when a lazy module's file is missing on the server.
    throw new TypeError(`Failed to fetch dynamically imported module: http://localhost:4173/assets/${fileName}`);
  }
  return load();
}
