// SIMULATED frame lanes (read-only preview helper). A browser cannot show a phone's separate JS and UI
// threads, so this module computes them: the screen shows a frame every 1000 / hz ms. A JS-driven
// animation needs a moment of free JS thread inside a frame slot to compute that frame's value; if the JS
// thread is busy for the whole slot, the frame repeats the old value (a dropped frame). A native-driven
// animation computes its values on the UI thread, so busy JavaScript does not drop its frames.
// busy: blocks of synchronous JavaScript, [{ start, end }] in ms since the animation started.
export function simulateFade({ hz, durationMs, driver, busy }) {
  const frames = [];
  const count = Math.round((durationMs * hz) / 1000);
  for (let k = 0; k < count; k += 1) {
    // Integer arithmetic: slot k covers [k * 1000 / hz, (k + 1) * 1000 / hz).
    const blocked = busy.some((block) => block.start * hz <= k * 1000 && (k + 1) * 1000 <= block.end * hz);
    const dropped = driver === 'js' && blocked;
    frames.push({ frame: k + 1, startMs: Math.round((k * 1000) / hz), jsBusy: blocked, dropped });
  }
  return frames;
}
