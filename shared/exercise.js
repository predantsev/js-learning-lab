// How a workspace block (example/exercise) becomes a sandbox run. Shared by the lesson UI and the
// content validator so that what authors validate is exactly what learners execute.
export const TESTS_PATH = '__tests__.js';

export function runInputForBlock(block, files, { mode = 'run', storage = {}, lang = 'uk' } = {}) {
  const capabilities = block.capabilities ?? {};
  const options = { network: capabilities.network ?? 'none' };
  if (Number.isFinite(capabilities.loopBudgetMs)) options.loopBudgetMs = capabilities.loopBudgetMs;
  if (Number.isFinite(capabilities.testTimeoutMs)) options.testTimeoutMs = capabilities.testTimeoutMs;
  if (Number.isFinite(capabilities.settleTimeoutMs)) options.settleTimeoutMs = capabilities.settleTimeoutMs;
  return {
    files,
    entry: block.entry,
    runtime: block.runtime,
    tests: mode === 'test' ? { path: TESTS_PATH, source: block.tests } : null,
    storage,
    options,
    lang,
  };
}

/** Text lines printed to the console (system notes excluded), as the learner sees them. */
export function consoleLines(entries) {
  const show = (v) => {
    switch (v.t) {
      case 'string': return v.v;
      case 'number': case 'boolean': case 'bigint': case 'symbol': case 'date': case 'regexp': return String(v.v);
      case 'null': return 'null';
      case 'undefined': return 'undefined';
      case 'function': return v.cls ? `class ${v.name}` : `ƒ ${v.name || '(anonymous)'}()`;
      case 'array': return `[${v.items.map(showNested).join(', ')}${v.length > v.items.length ? ', …' : ''}]`;
      case 'object': return `${v.ctor && v.ctor !== 'Object' ? `${v.ctor} ` : ''}{${v.entries.map(([k, x]) => `${k}: ${showNested(x)}`).join(', ')}${v.more ? ', …' : ''}}`;
      case 'map': return `Map(${v.size}) {${v.entries.map(([k, x]) => `${showNested(k)} => ${showNested(x)}`).join(', ')}}`;
      case 'set': return `Set(${v.size}) {${v.items.map(showNested).join(', ')}}`;
      case 'error': return `${v.name}: ${v.message}`;
      case 'node': return v.v;
      case 'typed': return `${v.name}(${v.length}) [${v.items.join(', ')}]`;
      case 'promise': return 'Promise';
      case 'circular': return '[Circular]';
      case 'empty': return '<empty>';
      case 'accessor': return '[Getter/Setter]';
      default: return v.name ?? v.t;
    }
  };
  const showNested = (v) => (v.t === 'string' ? JSON.stringify(v.v) : show(v));
  return entries.filter((e) => e.level !== 'system').map((e) => e.args.map(show).join(' '));
}
export { consoleLines as default };
