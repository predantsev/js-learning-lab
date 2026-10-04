// detectHost is checked against the real Node global and against hand-made global objects.
import { detectHost } from './host.js';

test('returns node for the real Node.js global', () => {
  expect(typeof detectHost, 'type of detectHost').toBe('function');
  expect(detectHost(), 'detectHost()').toBe('node');
  expect(detectHost(globalThis), 'detectHost(globalThis)').toBe('node');
});

test('returns node for a Node.js version without navigator', () => {
  // Node 20 has process.versions.node but no navigator global.
  const node20 = { process: { versions: { node: '20.11.1' } } };
  expect(detectHost(node20), 'detectHost of a Node 20 global').toBe('node');
});

test('returns browser for a page global', () => {
  const page = { window: {}, document: {}, navigator: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' } };
  expect(detectHost(page), 'detectHost of a page global').toBe('browser');
  // A page whose bundle added its own `process` stand-in: it has `env`, but no `versions.node`.
  const bundledPage = { window: {}, document: {}, process: { env: {}, versions: {}, browser: true } };
  expect(detectHost(bundledPage), 'detectHost of a page with a bundled process stand-in').toBe('browser');
});

test('returns unknown when neither host is recognized', () => {
  // A web worker: navigator says "Mozilla", but there is no window and no document.
  const worker = { navigator: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' } };
  expect(detectHost(worker), 'detectHost of a web worker global').toBe('unknown');
  // A host that defines `window` but has no page (no `document`).
  expect(detectHost({ window: {} }), 'detectHost of a global with window but no document').toBe('unknown');
  expect(detectHost({}), 'detectHost({})').toBe('unknown');
});
