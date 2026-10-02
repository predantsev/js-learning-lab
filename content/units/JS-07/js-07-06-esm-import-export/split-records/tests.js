// A namespace import never fails for a missing name, so these checks start even when an export is missing.
import * as domain from './domain/records.js';

const uiBindings = () => scopeOf('ui/render.js');

// Does ui/render.js reach `name` from domain/records.js — directly or through a namespace object?
const usesDomain = (name) => {
  const bindings = uiBindings();
  return Object.keys(bindings).some((key) => {
    let value;
    try {
      value = bindings[key];
    } catch (error) {
      return false;
    }
    return value === domain[name] || (value !== null && typeof value === 'object' && value[name] === domain[name]);
  });
};

test('the page opens without an error', () => {
  expect(loadError(), 'error while the page loaded').toBeNull();
});

test('domain/records.js exports validateRecord', () => {
  expect(typeof domain.validateRecord, 'the export validateRecord of domain/records.js').toBe('function');
});

test('domain/records.js exports summarize', () => {
  expect(typeof domain.summarize, 'the export summarize of domain/records.js').toBe('function');
});

test('validateRecord still checks the name and the frequency', () => {
  const good = { id: 'h-04', name: L.tidy, frequency: 'weekly', active: true, completions: [] };
  expect(domain.validateRecord?.(good), 'validateRecord(a valid habit)').toEqual({ ok: true, value: good });
  expect(domain.validateRecord?.({ id: 'h-09', name: ' ', frequency: 'monthly', active: true, completions: [] }), 'validateRecord(a habit with no name and an unknown frequency)')
    .toEqual({ ok: false, errors: { name: 'required', frequency: 'unknown' } });
});

test('summarize still counts active habits and completions', () => {
  const habits = [
    { id: 'h-02', name: L.read, frequency: 'daily', active: true, completions: ['2026-02-26', '2026-02-28'] },
    { id: 'h-06', name: L.walk, frequency: 'daily', active: false, completions: [] },
  ];
  expect(domain.summarize?.(habits), 'summarize(two habits)').toEqual({ count: 2, active: 1, completions: 2 });
});

test('ui/render.js uses the functions from domain/records.js', () => {
  for (const name of ['validateRecord', 'summarize']) {
    expect(typeof domain[name], name + ' exported by domain/records.js').toBe('function');
    expect(usesDomain(name), name + ' in ui/render.js comes from domain/records.js').toBe(true);
    const own = uiBindings()[name];
    if (own !== undefined) expect(own, name + ' as ui/render.js sees it').toBe(domain[name]);
  }
});

test('the page shows the same summary and list', () => {
  expect(screen.$('#summary'), 'the summary paragraph').toHaveTextContent(L.activeText + '2 / 3 · ' + L.completionsText + '5');
  expect(screen.$$('#habits li').map((item) => item.textContent), 'the list items').toEqual([L.exercise, L.water, L.words, L.invalid + 'h-08']);
});
