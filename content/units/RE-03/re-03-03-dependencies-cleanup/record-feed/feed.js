// A fake live feed of record updates: an external system that React knows nothing about.
let live = 0;

export function subscribe(recordId, onUpdate) {
  live += 1;
  console.log(`subscribe ${recordId} → live: ${live}`);
  let count = 0;
  const timer = setInterval(() => {
    count += 1;
    onUpdate(`${recordId} · %%update%% ${count}`);
  }, 700);
  return function unsubscribe() {
    clearInterval(timer);
    live -= 1;
    console.log(`unsubscribe ${recordId} → live: ${live}`);
  };
}
