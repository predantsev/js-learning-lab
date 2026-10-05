// A fake clock: while a check runs, setTimeout and setInterval only record timers, and the check
// moves time forward itself. No check waits for a real second, and none depends on how fast the
// computer is. clearTimeout/clearInterval are replaced too, so a fake id never clears a real timer.
function useFakeClock() {
  const real = {
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    setInterval: window.setInterval,
    clearInterval: window.clearInterval,
  };
  const timers = [];
  let now = 0;
  let nextId = 1;
  const add = (fn, ms, args, repeat) => {
    const id = `fake-${nextId++}`;
    const wait = Math.max(0, Number(ms) || 0);
    timers.push({ id, seq: nextId, at: now + wait, fn, args, every: repeat ? Math.max(1, wait) : null });
    return id;
  };
  const remove = (id) => {
    const index = timers.findIndex((timer) => timer.id === id);
    if (index !== -1) timers.splice(index, 1);
    else real.clearTimeout(id);
  };
  window.setTimeout = (fn, ms = 0, ...args) => add(fn, ms, args, false);
  window.setInterval = (fn, ms = 0, ...args) => add(fn, ms, args, true);
  window.clearTimeout = remove;
  window.clearInterval = remove;
  return {
    advance(ms) {
      const end = now + ms;
      for (;;) {
        timers.sort((a, b) => a.at - b.at || a.seq - b.seq);
        const next = timers[0];
        if (!next || next.at > end) break;
        timers.shift();
        now = next.at;
        if (next.every !== null) timers.push({ ...next, seq: nextId++, at: now + next.every });
        if (typeof next.fn === "function") next.fn(...next.args);
      }
      now = end;
    },
    restore() {
      Object.assign(window, real);
    },
  };
}

const field = () => screen.byRole("textbox");
const sendButton = () => screen.byRole("button", { name: L.send });
const sentLines = () => logs().filter((line) => line.startsWith(L.sent));

test("the field is empty right after the click", async () => {
  const clock = useFakeClock();
  try {
    await user.fill(field(), L.payBill);
    await user.click(sendButton());
    expect(field(), "the field right after the click").toHaveValue("");
  } finally {
    clock.restore();
  }
});

test("nothing is printed before one second has passed", async () => {
  const clock = useFakeClock();
  try {
    const before = sentLines().length;
    await user.fill(field(), L.waterPlants);
    await user.click(sendButton());
    clock.advance(999);
    await settle();
    expect(sentLines().length - before, "new lines starting with “" + L.sent + "” 999 ms after the click").toBe(0);
  } finally {
    clock.restore();
  }
});

test("one second later the text from the moment of the click is printed once", async () => {
  const clock = useFakeClock();
  try {
    const before = sentLines().length;
    await user.fill(field(), L.dentist);
    await user.click(sendButton());
    await user.type(field(), L.more);
    clock.advance(1000);
    await settle();
    expect(sentLines().slice(before), "the new lines starting with “" + L.sent + "” one second after the click").toEqual([L.sent + " " + L.dentist]);
  } finally {
    clock.restore();
  }
});
