// Node.js 25 defines a `localStorage` global whose getter prints "Warning: `--localstorage-file` was
// provided without a valid path" when no storage file is configured. @babel/standalone bundles the
// browser build of the `debug` package, which reads `localStorage` while it loads. transform.js
// imports this module right before Babel and node-webstorage-restore.js right after it: while Babel
// loads, the global reads as `undefined` (what `debug` expects outside a browser), so the getter never
// runs; then the original property is put back. Other warnings are untouched. In a browser (the app
// bundle) this does nothing.
export const hiddenWebStorage = (() => {
  if (typeof process !== 'object' || process === null || !process.versions || !process.versions.node) return null;
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  if (!descriptor || typeof descriptor.get !== 'function' || !descriptor.configurable) return null;
  Object.defineProperty(globalThis, 'localStorage', { value: undefined, writable: true, configurable: true, enumerable: false });
  return descriptor;
})();
