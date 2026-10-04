// Reads a .cpuprofile (the JSON that `node --cpu-prof` writes) and writes a profiling note.
// This version first adds up the time of every node, then groups the nodes by function.

export function topSelfTime(profile, n) {
  const perNode = new Map();
  for (let i = 0; i < profile.samples.length; i++) {
    perNode.set(profile.samples[i], (perNode.get(profile.samples[i]) ?? 0) + profile.timeDeltas[i]);
  }

  const groups = {};
  for (const node of profile.nodes) {
    const micros = perNode.get(node.id) ?? 0;
    const frame = node.callFrame;
    if (micros === 0 || frame.functionName === '(idle)') continue;
    const key = JSON.stringify([frame.functionName, frame.url, frame.lineNumber]);
    groups[key] ??= { name: frame.functionName === '' ? '(anonymous)' : frame.functionName, url: frame.url, line: frame.lineNumber + 1, micros: 0 };
    groups[key].micros += micros;
  }

  const ranked = Object.values(groups).toSorted((a, b) => b.micros - a.micros);
  return ranked.slice(0, n).map((f) => ({ name: f.name, url: f.url, line: f.line, selfMs: Number((f.micros / 1000).toFixed(1)) }));
}

export function profilingNote({ command, before, after, p95Before, p95After }) {
  let text = `## Profiling note\n\nCommand: \`${command}\`\n\n| | before | after |\n|---|---|---|\n`;
  for (let i = 0; i < Math.max(before.length, after.length); i++) {
    const cell = (f) => (f ? `${f.name} ${f.selfMs} ms` : '');
    text += `| ${i + 1} | ${cell(before[i])} | ${cell(after[i])} |\n`;
  }
  text += `\np95 from /metrics: ${p95Before} ms before, ${p95After} ms after.\n`;
  return text;
}
