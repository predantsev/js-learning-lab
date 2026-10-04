import { declaration } from './declaration.js';
import { dataFlow, PURPOSES } from './data-flow.js';

const LEAVES = ['mock-service', 'crash-library'];
const lineFor = (field) => declaration.filter((line) => line.field === field);

test('every field of the data flow has exactly one line', () => {
  for (const { field } of dataFlow) {
    expect(lineFor(field).length, `lines for ${field}`).toBe(1);
  }
  expect(declaration.length, 'lines in the declaration').toBe(dataFlow.length);
});

test('data that leaves the phone is declared collected and sent', () => {
  for (const { field } of dataFlow.filter((row) => LEAVES.includes(row.destination))) {
    const [line] = lineFor(field);
    expect(line?.collected, `${field}.collected`).toBe(true);
    expect(line?.where, `${field}.where`).toBe('sent');
  }
});

test('data that stays on the phone or is removed is not declared collected', () => {
  for (const { field, destination } of dataFlow.filter((row) => !LEAVES.includes(row.destination))) {
    const [line] = lineFor(field);
    expect(line?.collected, `${field}.collected`).toBe(false);
    expect(line?.where, `${field}.where`).toBe(destination === 'device' ? 'device' : 'none');
  }
});

test('each collected field carries the purpose from the data flow', () => {
  for (const { field, purpose } of dataFlow.filter((row) => LEAVES.includes(row.destination))) {
    const [line] = lineFor(field);
    expect(PURPOSES.includes(line?.purpose), `${field}.purpose is one of PURPOSES`).toBe(true);
    expect(line?.purpose, `${field}.purpose`).toBe(purpose);
  }
});
