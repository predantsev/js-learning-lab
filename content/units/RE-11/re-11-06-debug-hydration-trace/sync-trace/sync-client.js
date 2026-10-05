// What the browser may call: OUR server's endpoint, which adds the token itself. Pretended here.
export async function requestSync() {
  console.log("POST /api/sync");
  return "%%queued%%";
}
