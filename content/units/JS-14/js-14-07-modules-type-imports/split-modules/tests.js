import * as validate from './domain/validate.ts';
import * as render from './ui/render.ts';

test('domain/validate.ts exports isPriority that accepts only the three priorities', () => {
  expect(typeof validate.isPriority, 'type of isPriority exported from domain/validate.ts').toBe('function');
  expect(['low', 'normal', 'high'].map(validate.isPriority), 'the three priorities').toEqual([true, true, true]);
  expect(validate.isPriority('urgent'), 'isPriority("urgent")').toBe(false);
  expect(validate.isPriority(2), 'isPriority(2)').toBe(false);
});

test('domain/validate.ts exports validateTitle that returns an error key or null', () => {
  expect(typeof validate.validateTitle, 'type of validateTitle exported from domain/validate.ts').toBe('function');
  expect(validate.validateTitle('  '), 'validateTitle("  ")').toBe('required');
  expect(validate.validateTitle('x'.repeat(81)), 'an 81-character title').toBe('too-long');
  expect(validate.validateTitle(` ${L.dentist} `), 'a normal title').toBeNull();
});

test('ui/render.ts exports renderTask', () => {
  expect(typeof render.renderTask, 'type of renderTask exported from ui/render.ts').toBe('function');
  expect(render.renderTask({ id: 't-05', title: L.dentist, priority: 'normal', done: false }), 'renderTask of a pending task').toBe(`[ ] ${L.dentist} (normal)`);
});

test('the program prints the same three lines as before', () => {
  expect(logs(), 'the console of the program').toEqual([`[ ] ${L.books} (high)`, `[x] ${L.internet} (high)`, 'false required']);
});
