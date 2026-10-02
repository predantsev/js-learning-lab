// Source transform shared by the app, the content validator and unit tests.
// Learner files stay untouched on disk/in storage; this produces the executable form for the
// sandbox: types/JSX removed, relative imports rewritten to import-map specifiers, loops guarded
// by a time budget, and (optionally) top-level bindings exposed to behavior tests.
// The two node-webstorage modules keep Babel from touching Node's localStorage global while it
// loads (a warning on Node 25); import order matters.
import './node-webstorage-hide.js';
import * as BabelNs from '@babel/standalone';
import './node-webstorage-restore.js';

const Babel = BabelNs.default ?? BabelNs;

export const DEFAULT_LOOP_BUDGET_MS = 2000;
export const MODULE_PREFIX = '~/';

const SCRIPT_EXT = ['.js', '.mjs', '.jsx', '.ts', '.tsx'];
const extOf = (path) => {
  const i = path.lastIndexOf('.');
  return i === -1 ? '' : path.slice(i).toLowerCase();
};
export const isScriptFile = (path) => SCRIPT_EXT.includes(extOf(path));

/** Normalize "a/./b/../c.js" → "a/c.js"; returns null when the path escapes the project root. */
export function normalizePath(path) {
  const out = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (out.length === 0) return null;
      out.pop();
    } else out.push(part);
  }
  return out.join('/');
}

const dirOf = (path) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');

/**
 * Resolve an import specifier written in `fromPath`.
 * resolution 'strict'  — browser-like: the file extension is required (teaches real ESM rules);
 *                        "./x.js" may resolve to "x.ts"/"x.tsx" (TypeScript convention).
 * resolution 'bundler' — Vite-like: extension may be omitted, "index" files are found.
 * @returns {{path:string}|{external:string}|{error:string, code:string}}
 */
export function resolveImport(spec, fromPath, files, resolution = 'strict') {
  const relative = spec.startsWith('./') || spec.startsWith('../');
  if (!relative && !spec.startsWith('/')) return { external: spec };
  const base = spec.startsWith('/') ? spec.slice(1) : `${dirOf(fromPath)}/${spec}`;
  const target = normalizePath(base);
  if (target === null) return { error: `"${spec}" points outside the project folder.`, code: 'outside-root' };
  const has = (p) => Object.prototype.hasOwnProperty.call(files, p);
  if (has(target)) return { path: target };
  const ext = extOf(target);
  if (ext === '.js' || ext === '.jsx') {
    const stem = target.slice(0, -ext.length);
    for (const e of ['.ts', '.tsx']) if (has(stem + e)) return { path: stem + e };
  }
  if (resolution === 'bundler') {
    for (const e of SCRIPT_EXT) if (has(target + e)) return { path: target + e };
    for (const e of SCRIPT_EXT) if (has(`${target}/index${e}`)) return { path: `${target}/index${e}` };
  } else if (ext === '') {
    const candidate = SCRIPT_EXT.find((e) => has(target + e));
    if (candidate) {
      return { error: `Cannot find "${spec}". In the browser the file extension is required: did you mean "${spec}${candidate}"?`, code: 'missing-extension' };
    }
  }
  return { error: `Cannot find the file "${spec}" imported from "${fromPath}".`, code: 'not-found' };
}

function loopGuardPlugin({ types: t }, { budgetMs }) {
  const hasOwnAwaitOrYield = (loopPath) => {
    let found = false;
    loopPath.traverse({
      Function(p) { p.skip(); },
      AwaitExpression(p) { found = true; p.stop(); },
      YieldExpression(p) { found = true; p.stop(); },
      ForOfStatement(p) { if (p.node.await) { found = true; p.stop(); } },
    });
    return found || (loopPath.isForOfStatement() && loopPath.node.await);
  };
  return {
    name: 'jsll-loop-guard',
    visitor: {
      'WhileStatement|DoWhileStatement|ForStatement|ForInStatement|ForOfStatement'(path) {
        if (path.node.__jsllGuarded) return;
        path.node.__jsllGuarded = true;
        // Loops that yield to the event loop do not block; the Stop control handles them.
        if (hasOwnAwaitOrYield(path)) return;
        const line = path.node.loc ? path.node.loc.start.line : 0;
        const start = path.scope.generateUidIdentifier('ls');
        const count = path.scope.generateUidIdentifier('lc');
        const check = t.ifStatement(
          t.logicalExpression(
            '&&',
            t.binaryExpression('===', t.binaryExpression('&', t.updateExpression('++', count, true), t.numericLiteral(255)), t.numericLiteral(0)),
            t.binaryExpression('>', t.binaryExpression('-', t.callExpression(t.memberExpression(t.identifier('Date'), t.identifier('now')), []), start), t.numericLiteral(budgetMs)),
          ),
          t.expressionStatement(t.callExpression(t.identifier('__jsllLoopExceeded'), [t.numericLiteral(line), t.numericLiteral(budgetMs)])),
        );
        const body = path.get('body');
        if (body.isBlockStatement()) body.unshiftContainer('body', check);
        else body.replaceWith(t.blockStatement([check, body.node]));
        const decl = t.variableDeclaration('let', [
          t.variableDeclarator(start, t.callExpression(t.memberExpression(t.identifier('Date'), t.identifier('now')), [])),
          t.variableDeclarator(count, t.numericLiteral(0)),
        ]);
        // A label must stay attached to its loop, so the declaration goes before the outermost label.
        let anchor = path;
        while (anchor.parentPath && anchor.parentPath.isLabeledStatement()) anchor = anchor.parentPath;
        anchor.insertBefore(decl);
      },
    },
  };
}

function rewriteImportsPlugin({ types: t }, { resolve, onError }) {
  const rewrite = (sourceNode, path) => {
    const result = resolve(sourceNode.value);
    if (result.error) {
      onError({ message: result.error, code: result.code, line: sourceNode.loc?.start.line ?? null, column: sourceNode.loc?.start.column ?? null });
      return;
    }
    if (result.path) sourceNode.value = MODULE_PREFIX + result.path;
    void path;
  };
  // import(…) is wrapped in __jsllImported(…) (sandbox runtime): a failed import rejects with the
  // same error, its message naming project paths instead of import-map keys ('~/records.js').
  const wrapImport = (path) => {
    path.node.__jsllWrapped = true;
    path.replaceWith(t.callExpression(t.identifier('__jsllImported'), [path.node]));
  };
  return {
    name: 'jsll-rewrite-imports',
    visitor: {
      ImportDeclaration(path) { rewrite(path.node.source, path); },
      ExportAllDeclaration(path) { rewrite(path.node.source, path); },
      ExportNamedDeclaration(path) { if (path.node.source) rewrite(path.node.source, path); },
      ImportExpression(path) {
        if (path.node.__jsllWrapped) return;
        const arg = path.node.source;
        if (t.isStringLiteral(arg)) rewrite(arg, path);
        else path.node.source = t.callExpression(t.identifier('__jsllResolve'), [arg, t.stringLiteral(this.file.opts.filename.replace(/^\//, ''))]);
        wrapImport(path);
      },
      CallExpression(path) {
        if (!t.isImport(path.node.callee) || path.node.__jsllWrapped) return;
        const arg = path.node.arguments[0];
        if (t.isStringLiteral(arg)) rewrite(arg, path);
        else if (arg) path.node.arguments[0] = t.callExpression(t.identifier('__jsllResolve'), [arg, t.stringLiteral(this.file.opts.filename.replace(/^\//, ''))]);
        wrapImport(path);
      },
    },
  };
}

// Exposes top-level bindings (even without `export`) so beginner exercises can be checked by
// behavior tests: scope.total, scope.greet(). Getters keep TDZ/late-assignment semantics intact.
function exportScopePlugin({ types: t }, { file }) {
  return {
    name: 'jsll-export-scope',
    visitor: {
      Program: {
        exit(path) {
          // Skip helper bindings introduced by the loop guard and the JSX runtime.
          const names = Object.keys(path.scope.bindings).filter((n) => !/^_(ls|lc)\d*$|^_jsx/.test(n));
          const props = names.map((n) => t.objectMethod('get', t.identifier(n), [], t.blockStatement([t.returnStatement(t.identifier(n))])));
          path.pushContainer('body', t.expressionStatement(t.callExpression(t.identifier('__jsllScope'), [t.stringLiteral(file), t.objectExpression(props)])));
        },
      },
    },
  };
}

function cleanBabelError(error, file) {
  const raw = String(error.message ?? error);
  const [first, ...rest] = raw.split('\n');
  const message = first.replace(/^\/?[^:]+: /, '').replace(/ \(\d+:\d+\)$/, '');
  return {
    kind: 'syntax',
    file,
    message,
    line: error.loc?.line ?? null,
    column: error.loc?.column != null ? error.loc.column + 1 : null,
    frame: rest.join('\n').trim() || null,
    raw,
  };
}

/**
 * Transform one script file to an ES module for the sandbox.
 * @returns {{code:string}|{error:object}}
 */
export function transformScript(path, source, options = {}) {
  const { files = {}, resolution = 'strict', loopBudgetMs = DEFAULT_LOOP_BUDGET_MS, exportScope = false, extraPlugins = [], jsxDev = true, classic = false, allowedExternals = null } = options;
  const ext = extOf(path);
  const presets = [];
  if (ext === '.ts' || ext === '.tsx') presets.push(['typescript', { isTSX: ext === '.tsx', allExtensions: true, onlyRemoveTypeImports: false }]);
  if (ext === '.jsx' || ext === '.tsx' || options.jsxInJs) presets.push(['react', { runtime: 'automatic', development: jsxDev }]);
  const importErrors = [];
  const resolve = (spec) => {
    const result = resolveImport(spec, path, files, resolution);
    if (result.external !== undefined && allowedExternals !== null && !allowedExternals.includes(result.external)) {
      if (/^node:|^(fs|path|http|https|os|crypto|child_process|url|util|events|stream|net)(\/|$)/.test(result.external)) {
        return { error: `"${result.external}" is a Node.js module; it does not exist in the browser.`, code: 'node-module-in-browser' };
      }
      const available = allowedExternals.length > 0 ? ` Available here: ${allowedExternals.join(', ')}.` : ' This exercise runs plain browser JavaScript without packages.';
      return { error: `The package "${result.external}" is not available in the in-course sandbox.${available}`, code: 'unknown-package' };
    }
    return result;
  };
  // Classic scripts cannot contain import/export; the parser reports that as a syntax error.
  const plugins = classic ? [...extraPlugins] : [[rewriteImportsPlugin, { resolve, onError: (e) => importErrors.push(e) }], ...extraPlugins];
  if (loopBudgetMs > 0) plugins.push([loopGuardPlugin, { budgetMs: loopBudgetMs }]);
  if (exportScope && !classic) plugins.push([exportScopePlugin, { file: path }]);
  try {
    const out = Babel.transform(source, {
      filename: `/${path}`,
      presets,
      plugins,
      retainLines: true,
      sourceType: classic ? 'script' : 'module',
      babelrc: false,
      configFile: false,
      compact: false,
      parserOpts: { plugins: ['explicitResourceManagement', 'importAttributes'] },
    });
    if (importErrors.length > 0) {
      const e = importErrors[0];
      return { error: { kind: 'import', file: path, message: e.message, code: e.code, line: e.line, column: e.column != null ? e.column + 1 : null, frame: null, raw: e.message } };
    }
    return { code: `${out.code}\n//# sourceURL=${path}` };
  } catch (error) {
    return { error: cleanBabelError(error, path) };
  }
}

const jsString = (value) => JSON.stringify(value).replace(/<\/script/gi, '<\\/script');

/** Turn any project file into module source text (or null when it is not importable). */
export function moduleSourceFor(path, source, options) {
  const ext = extOf(path);
  if (SCRIPT_EXT.includes(ext)) return transformScript(path, source, options);
  if (ext === '.json') {
    try {
      JSON.parse(source);
    } catch (e) {
      return { error: { kind: 'syntax', file: path, message: `Invalid JSON: ${e.message}`, line: null, column: null, frame: null, raw: String(e.message) } };
    }
    return { code: `export default ${source.trim()};\n//# sourceURL=${path}` };
  }
  if (ext === '.css') {
    return { code: `const style = document.createElement('style');\nstyle.dataset.file = ${jsString(path)};\nstyle.textContent = ${jsString(source)};\ndocument.head.append(style);\nexport default style;\n//# sourceURL=${path}` };
  }
  return { code: `export default ${jsString(source)};\n//# sourceURL=${path}` };
}

/**
 * Transform a whole project (map of path → source).
 * @returns {{modules: Record<string,string>, errors: object[]}}
 */
export function transformProject(files, options = {}) {
  const modules = {};
  const errors = [];
  const scopeFiles = options.exportScopeFor ?? [];
  for (const [path, source] of Object.entries(files)) {
    if (extOf(path) === '.html') continue;
    const result = moduleSourceFor(path, source, { ...options, files, exportScope: scopeFiles.includes(path) || options.exportScope === true });
    if (result.error) errors.push(result.error);
    else modules[path] = result.code;
  }
  return { modules, errors };
}
