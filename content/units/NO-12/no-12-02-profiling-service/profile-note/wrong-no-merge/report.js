// Reads a .cpuprofile (the JSON that `node --cpu-prof` writes) and writes a profiling note.

export function topSelfTime(profile, n) {
  const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
  const functions = new Map(); // "name url line" → { name, url, line, micros }

  profile.samples.forEach((nodeId, i) => {
    const { functionName, url, lineNumber } = nodes.get(nodeId).callFrame;
    if (functionName === '(idle)') return; // the process was waiting, not working
    const key = nodeId; // one entry per node of the call tree
    if (!functions.has(key)) {
      functions.set(key, { name: functionName || '(anonymous)', url, line: lineNumber + 1, micros: 0 });
    }
    functions.get(key).micros += profile.timeDeltas[i];
  });

  return [...functions.values()]
    .sort((a, b) => b.micros - a.micros)
    .slice(0, n)
    .map(({ name, url, line, micros }) => ({ name, url, line, selfMs: Math.round(micros / 100) / 10 }));
}

export function profilingNote({ command, before, after, p95Before, p95After }) {
  const list = (top) => top.map((f) => `${f.name} (${f.url}:${f.line}) ${f.selfMs} ms`).join(', ');
  return [
    `Command: ${command}`,
    `Top self time before: ${list(before)}`,
    `Top self time after: ${list(after)}`,
    `p95: ${p95Before} ms → ${p95After} ms`,
  ].join('\n');
}
