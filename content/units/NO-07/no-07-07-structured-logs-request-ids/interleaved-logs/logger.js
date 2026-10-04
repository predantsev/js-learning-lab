// A tiny logger with two formats. Every line is printed and also kept in `lines`, so the demo
// can search them afterwards.
export function createLogger(format) {
  const lines = [];
  function log(level, message, fields = {}) {
    const line = format === 'json'
      ? JSON.stringify({ time: new Date().toISOString(), level, msg: message, ...fields })
      : `${level.toUpperCase()} ${message}`;
    lines.push(line);
    console.log(line);
  }
  return { log, lines };
}
