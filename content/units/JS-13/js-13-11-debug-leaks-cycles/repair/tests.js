import { live } from './counter.js';

function importGraph() {
  const graph = {};
  for (const [path, source] of Object.entries(files)) {
    if (!path.endsWith('.js') || path === '__tests__.js') continue;
    const targets = [];
    const pattern = /(?:^|\n)\s*(?:import|export)\b[^;]*?from\s*["']\.\/([^"']+)["']|(?:^|\n)\s*import\s*["']\.\/([^"']+)["']/g;
    for (const match of source.matchAll(pattern)) targets.push(match[1] ?? match[2]);
    graph[path] = targets;
  }
  return graph;
}
function findCycle(graph) {
  const state = {};
  const stack = [];
  function visit(node) {
    state[node] = 'open';
    stack.push(node);
    for (const next of graph[node] ?? []) {
      if (state[next] === 'open') return [...stack.slice(stack.indexOf(next)), next];
      if (state[next] === undefined) {
        const found = visit(next);
        if (found) return found;
      }
    }
    stack.pop();
    state[node] = 'done';
    return null;
  }
  for (const node of Object.keys(graph)) {
    if (state[node] === undefined) {
      const found = visit(node);
      if (found) return found;
    }
  }
  return null;
}
const newRoot = () => {
  const root = document.createElement('section');
  document.body.append(root);
  return root;
};

test('the program prints 0 0, Київ, the limit, the render error and 0 0', () => {
  expect(logs(), 'the console of the program').toEqual([`${L.live} 0 0`, 'Київ', L.tooBig.replace('{max}', '16'), L.broken, `${L.live} 0 0`]);
});

test('every module loads and no import cycle remains', async () => {
  for (const path of ['./limits.js', './describe.js', './text.js', './panel.js']) {
    let failure = null;
    try {
      await import(path);
    } catch (error) {
      failure = `${error.name}: ${error.message}`;
    }
    expect(failure, `the error while loading ${path}`).toBeNull();
  }
  const cycle = findCycle(importGraph());
  expect(cycle === null ? 'no cycle' : cycle.join(' → '), 'the import cycle found').toBe('no cycle');
});

test('the limit modules keep their exports', async () => {
  const limits = await import('./limits.js');
  const describe = await import('./describe.js');
  expect(limits.MAX_BYTES, 'MAX_BYTES from limits.js').toBe(16);
  expect(describe.LIMIT_TEXT, 'LIMIT_TEXT from describe.js').toBe(L.tooBig.replace('{max}', '16'));
  expect(limits.checkSize(16), 'checkSize(16)').toBeNull();
  expect(limits.checkSize(17), 'checkSize(17)').toBe(L.tooBig.replace('{max}', '16'));
});

test('five mount/teardown cycles leave no listener and no timer', async () => {
  const { mountPanel } = await import('./panel.js');
  const root = newRoot();
  const before = live();
  for (let i = 0; i < 5; i += 1) {
    const teardown = mountPanel(root, (element) => { element.textContent = 'x'; });
    teardown();
  }
  expect(live(), 'live listeners and timers compared with before the cycles').toEqual(before);
});

test('after teardown Escape and clicks change nothing', async () => {
  const { mountPanel } = await import('./panel.js');
  const root = newRoot();
  const teardown = mountPanel(root, (element) => { element.textContent = 'x'; });
  teardown();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  root.click();
  expect(root.hidden, 'root.hidden after Escape').toBe(false);
  expect(root.dataset.clicks, 'data-clicks after a click').toBeUndefined();
});

test('a failing render is cleaned up and its own error reaches the caller', async () => {
  const { mountPanel } = await import('./panel.js');
  const root = newRoot();
  const failure = new Error('render failed');
  const before = live();
  let caught = null;
  try {
    mountPanel(root, () => {
      throw failure;
    });
  } catch (error) {
    caught = error;
  }
  expect(caught, 'the error mountPanel threw').toBe(failure);
  expect(live(), 'live listeners and timers compared with before the failed mount').toEqual(before);
});

test('chunks are decoded without breaking letters', async () => {
  const { decodeChunks } = await import('./text.js');
  const bytes = new TextEncoder().encode('Київ 🐈');
  for (let cut = 0; cut <= bytes.length; cut += 1) {
    expect(decodeChunks([bytes.slice(0, cut), bytes.slice(cut)]), `decodeChunks cut after byte ${cut}`).toBe('Київ 🐈');
  }
  expect(decodeChunks([bytes.slice(0, 1), bytes.slice(1, 9), bytes.slice(9)]), 'decodeChunks of three chunks').toBe('Київ 🐈');
});

test('byteLength counts UTF-8 bytes', async () => {
  const { byteLength, fitPayload } = await import('./text.js');
  expect(byteLength('Київ'), 'byteLength("Київ")').toBe(8);
  expect(byteLength('🐈'), 'byteLength("🐈")').toBe(4);
  expect(fitPayload('Київ, Львів').bytes, 'fitPayload("Київ, Львів").bytes').toBe(20);
  expect(fitPayload('Київ, Львів').problem, 'fitPayload("Київ, Львів").problem').toBe(L.tooBig.replace('{max}', '16'));
  expect(fitPayload('Київ').problem, 'fitPayload("Київ").problem').toBeNull();
});
