// Checks the shape of the threat model, then runs every cited proof against a fresh lab server.
import { createLabServer } from './lab-server.js';
import { CONTROLS, ENTRY_POINTS, PROOFS } from './model.js';
import { threats } from './threats.js';

const rows = Array.isArray(threats) ? threats : [];
const FIELDS = ['asset', 'threat', 'entryPoint', 'control', 'proof'];
const label = (row, i) => `row ${i + 1} (${row?.proof ?? '?'})`;

test('at least five rows, each with asset, threat, entryPoint, control and proof filled in', () => {
  expect(rows.length >= 5, `rows: ${rows.length}`).toBe(true);
  rows.forEach((row, i) => {
    for (const field of FIELDS) {
      expect(typeof row?.[field] === 'string' && row[field].trim() !== '', `${label(row, i)}: ${field} is non-empty text`).toBe(true);
    }
  });
});

test('five different threats answered by at least five different controls', () => {
  expect(new Set(rows.map((row) => row.threat)).size >= 5, 'different threat sentences').toBe(true);
  expect(new Set(rows.map((row) => row.control)).size >= 5, `different controls: ${[...new Set(rows.map((row) => row.control))].join(', ')}`).toBe(true);
});

test('every entryPoint and control comes from model.js, and every proof exists', () => {
  rows.forEach((row, i) => {
    expect(ENTRY_POINTS.includes(row.entryPoint), `${label(row, i)}: entryPoint "${row.entryPoint}" is in ENTRY_POINTS`).toBe(true);
    expect(CONTROLS.includes(row.control), `${label(row, i)}: control "${row.control}" is in CONTROLS`).toBe(true);
    expect(Object.hasOwn(PROOFS, row.proof), `${label(row, i)}: proof "${row.proof}" is in PROOFS`).toBe(true);
  });
});

test("each row's proof checks that row's control at that row's entry point", () => {
  rows.forEach((row, i) => {
    const proof = PROOFS[row.proof];
    expect(proof?.control, `${label(row, i)}: the control this proof checks`).toBe(row.control);
    expect(proof?.entryPoints.includes(row.entryPoint), `${label(row, i)}: the proof applies at "${row.entryPoint}"`).toBe(true);
  });
});

test('the model covers a non-browser caller, and CORS is never its control', () => {
  const direct = rows.filter((row) => row.entryPoint === 'non-browser-client');
  expect(direct.length > 0, 'rows with entryPoint "non-browser-client"').toBe(true);
  for (const row of direct) expect(row.control, `control of "${row.threat}"`).not.toBe('cors-allowlist');
});

test('every cited proof passes against the lab server', async () => {
  for (const name of new Set(rows.map((row) => row.proof))) {
    if (!Object.hasOwn(PROOFS, name)) continue;
    const base = await listen(createLabServer());
    expect(await PROOFS[name].run(base), `proof "${name}"`).toBe(true);
  }
});
