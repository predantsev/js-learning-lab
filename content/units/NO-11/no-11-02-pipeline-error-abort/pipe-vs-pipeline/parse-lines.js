// A transform stream: bytes of JSON lines in, the same records re-serialized out.
// A line that is not valid JSON fails the stream with an error that names the line number.
import { Transform } from 'node:stream';

export function parseJsonLines() {
  let rest = '';
  let lineNumber = 0;
  return new Transform({
    transform(chunk, encoding, done) {
      const lines = (rest + chunk).split('\n');
      rest = lines.pop(); // an incomplete last line waits for the next chunk
      let out = '';
      for (const line of lines) {
        lineNumber += 1;
        try {
          out += `${JSON.stringify(JSON.parse(line))}\n`;
        } catch {
          return done(new Error(`%%line%% ${lineNumber}: %%notJson%%`));
        }
      }
      done(null, out);
    },
  });
}
