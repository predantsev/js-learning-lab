// Lazy loader for the Node-only execution helpers. The specifier is kept opaque so bundlers leave
// it alone: compilation never runs in the browser, validation does.
const EXEC_MODULE = './exec-node.js';
let loading = null;
export function loadExec() {
  if (loading === null) loading = import(/* @vite-ignore */ EXEC_MODULE);
  return loading;
}
