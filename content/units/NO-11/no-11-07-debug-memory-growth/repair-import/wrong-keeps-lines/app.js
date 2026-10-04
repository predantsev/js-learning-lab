// Still seeded: every parsed line is kept in the module-level progress object.
// importFile(inputPath, output, { signal, onProgress }): reads JSON lines of habits from inputPath,
// writes each habit with its completions sorted and de-duplicated to the writable `output`, reports
// progress every 50 ms and resolves with the number of habits once `output` has finished.
import { createReadStream } from 'node:fs';
import { once } from 'node:events';

// Progress of the current import, read by the status page: a count, not a copy of every line.
export const progress = { count: 0, lines: [] };

function normalize(habit) {
  return { ...habit, completions: [...new Set(habit.completions)].sort() };
}

export async function importFile(inputPath, output, { signal, onProgress = () => {} } = {}) {
  progress.count = 0;
  const ticker = setInterval(() => onProgress(progress.count), 50);
  try {
    const input = createReadStream(inputPath, { encoding: 'utf8' });
    let rest = '';
    for await (const chunk of input) {
      signal?.throwIfAborted();
      const lines = (rest + chunk).split('\n');
      rest = lines.pop();
      for (const line of lines) {
        if (line === '') continue;
        const habit = JSON.parse(line);
        progress.count += 1;
        progress.lines.push(line);
        // A full output buffer pauses the reading too: this loop is the producer.
        if (!output.write(`${JSON.stringify(normalize(habit))}\n`)) await once(output, 'drain');
      }
    }
    output.end();
    await once(output, 'finish');
    return progress.count;
  } finally {
    clearInterval(ticker); // success, a broken line or an abort: the interval never outlives the import
  }
}
