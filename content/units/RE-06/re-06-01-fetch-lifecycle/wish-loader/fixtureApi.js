// A fake server for this lesson. There is no network here: the answer comes from memory
// after a timer, so you can change how long it takes and whether it fails.
// Every request is printed to the console — the console is the request log.
const WISHES = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
  { id: "w-03", name: "%%bicycle%%", price: 240, acquired: false },
  { id: "w-04", name: "%%book%%", price: 25, acquired: true },
];

// The server's switches.
export const settings = {
  delayMs: 800, // how long every answer takes
  failNext: 0, // how many of the next requests fail
};

let sent = 0;

export function fetchWishes() {
  sent += 1;
  const number = sent;
  const fails = settings.failNext > 0;
  if (fails) settings.failNext -= 1;
  console.log(`→ #${number} GET /wishes`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fails) {
        console.log(`← #${number} 503`);
        reject(new Error("503 Service Unavailable"));
        return;
      }
      console.log(`← #${number} 200 [${WISHES.map((wish) => wish.id).join(", ")}]`);
      resolve(structuredClone(WISHES));
    }, settings.delayMs);
  });
}
