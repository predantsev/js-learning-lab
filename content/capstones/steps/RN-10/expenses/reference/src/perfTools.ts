// perfTools.ts: a JS frame meter and a fixed scroll script, so that every run measures the same thing.
// The lesson's version, adapted to this project's tsconfig without the DOM types: the meter starts at the
// first frame's timestamp instead of performance.now(), and the pause resolves through an arrow function.
import type { FlatList } from 'react-native';

export type FrameReport = { seconds: number; jsFps: number; longFrames: number; worstMs: number };

// Counts requestAnimationFrame callbacks on the JS thread for `durationMs`. A gap longer than 1.5 frames
// of a 60 Hz screen (25 ms) means the JS thread missed at least one frame: that is a "long frame".
export function measureJsFrames(durationMs: number): Promise<FrameReport> {
  return new Promise((resolve) => {
    let start = 0;
    let last = 0;
    let frames = 0;
    let longFrames = 0;
    let worstMs = 0;
    function tick(now: number) {
      const gap = now - last;
      last = now;
      frames += 1;
      if (gap > 25) longFrames += 1;
      worstMs = Math.max(worstMs, gap);
      if (now - start < durationMs) {
        requestAnimationFrame(tick);
      } else {
        const seconds = (now - start) / 1000;
        resolve({ seconds: Math.round(seconds * 10) / 10, jsFps: Math.round(frames / seconds), longFrames, worstMs: Math.round(worstMs) });
      }
    }
    requestAnimationFrame((first: number) => {
      start = first;
      last = first;
      requestAnimationFrame(tick);
    });
  });
}

// Scrolls the list down by 600 points every 500 ms, 20 times: 10 seconds, the same on every run.
export async function runScrollScript<T>(list: FlatList<T> | null): Promise<void> {
  for (let step = 1; step <= 20; step += 1) {
    list?.scrollToOffset({ offset: step * 600, animated: true });
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
  }
}
