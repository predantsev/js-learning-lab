// Checks an exported folder against its manifest: every listed file is read again,
// hashed with SHA-256 and compared with the hash written at export time.
const folder = "./exported/";

// The SHA-256 of a text as 64 hexadecimal characters, the same form the manifest uses.
async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const manifest = await (await fetch(folder + "jsll-manifest.json")).json();
console.log("%%filesListed%%", manifest.files.length);

for (const entry of manifest.files) {
  const response = await fetch(folder + entry.path);
  if (!response.ok) {
    console.log("%%missing%%", entry.path);
    continue;
  }
  const hash = await sha256Hex(await response.text());
  if (hash === entry.sha256) {
    console.log("%%same%%", entry.path);
  } else {
    console.log("%%changed%%", entry.path, hash.slice(0, 12) + "…");
  }
}
