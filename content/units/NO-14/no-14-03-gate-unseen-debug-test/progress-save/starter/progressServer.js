// A simulation of the club's API inside the page (read-only). It is not a Node.js server: saveProgress
// does not go over the network, it records the body and prints a "server:" line in the Console — the
// server log of this preview. A real server would also answer late or fail; this one answers at once.
export const savedOnServer = [];

export async function saveProgress(body) {
  savedOnServer.push(body);
  console.log(`server: PUT /progress ${body.memberId} ${body.bookId} → ${body.pages}`);
}
