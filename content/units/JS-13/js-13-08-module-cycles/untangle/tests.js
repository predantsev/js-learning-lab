// The import graph of the exercise files, read from their current text.
function importGraph() {
  const graph = {};
  for (const [path, source] of Object.entries(files)) {
    if (!path.endsWith('.js') || path === '__tests__.js') continue;
    const targets = [];
    const pattern = /(?:^|\n)\s*(?:import|export)\b[^;]*?from\s*["']\.\/([^"']+)["']|(?:^|\n)\s*import\s*["']\.\/([^"']+)["']/g;
    for (const match of source.matchAll(pattern)) {
      targets.push(match[1] ?? match[2]);
    }
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

test('the program prints the task label', () => {
  expect(logs(), 'the console of the program').toEqual([`${L.water} (3/3) !`]);
});

test('all three modules load without an error', async () => {
  for (const path of ['./tasks.js', './rules.js', './labels.js']) {
    let failure = null;
    try {
      await import(path);
    } catch (error) {
      failure = `${error.name}: ${error.message}`;
    }
    expect(failure, `the error while loading ${path}`).toBeNull();
  }
});

test('no import cycle remains', () => {
  const cycle = findCycle(importGraph());
  expect(cycle === null ? 'no cycle' : cycle.join(' → '), 'the import cycle found').toBe('no cycle');
});

test('tasks.js still exports PRIORITIES and createTask', async () => {
  const tasks = await import('./tasks.js');
  expect(tasks.PRIORITIES, 'PRIORITIES from tasks.js').toEqual(['low', 'normal', 'high']);
  expect(tasks.createTask('t-01', 'A', 'low'), 'createTask("t-01", "A", "low")').toEqual({ id: 't-01', title: 'A', priority: 'low', done: false });
});

test('rules.js still exports DEFAULT_PRIORITY and checkPriority', async () => {
  const rules = await import('./rules.js');
  expect(rules.DEFAULT_PRIORITY, 'DEFAULT_PRIORITY from rules.js').toBe('normal');
  expect(typeof rules.checkPriority, 'type of checkPriority from rules.js').toBe('function');
  expect(() => rules.checkPriority('high'), 'checkPriority("high")').not.toThrow();
  expect(() => rules.checkPriority('urgent'), 'checkPriority("urgent")').toThrow(RangeError);
});

test('createTask still rejects an unknown priority', async () => {
  const tasks = await import('./tasks.js');
  expect(() => tasks.createTask('t-02', 'B', 'urgent'), 'createTask with the priority "urgent"').toThrow(RangeError);
});

test('labels.js still describes tasks the same way', async () => {
  const labels = await import('./labels.js');
  expect(labels.describeTask({ title: 'A', priority: 'normal' }), 'describeTask of a normal task').toBe('A (2/3)');
  expect(labels.describeTask({ title: 'B', priority: 'low' }), 'describeTask of a low task').toBe('B (1/3) !');
});
