// Alternative: stream.pipeline with an async generator stage; pipeline handles backpressure and the
// signal, and the interval is cleared in finally.
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

export const progress = { count: 0, lastId: null };

function normalize(habit) {
  return { ...habit, completions: [...new Set(habit.completions)].sort() };
}

export async function importFile(inputPath, output, { signal, onProgress = () => {} } = {}) {
  progress.count = 0;
  const ticker = setInterval(() => onProgress(progress.count), 50);
  try {
    await pipeline(
      createReadStream(inputPath, { encoding: 'utf8' }),
      async function* toNormalizedLines(chunks) {
        let rest = '';
        for await (const chunk of chunks) {
          const lines = (rest + chunk).split('\n');
          rest = lines.pop();
          for (const line of lines) {
            if (!line) continue;
            const habit = JSON.parse(line);
            progress.count += 1;
            progress.lastId = habit.id;
            yield JSON.stringify(normalize(habit)) + '\n';
          }
        }
      },
      output,
      { signal },
    );
    return progress.count;
  } finally {
    clearInterval(ticker);
  }
}
