// Execution tracer: a Babel plugin that instruments learner/author code so that running it
// produces a step-by-step trace (current line, scopes with their bindings, call stack, heap,
// console) through the `__jsllTrace` runtime (sandbox/trace-runtime.js).
//
// Design: every Babel scope that owns bindings becomes a *scope instance* object created at
// run time (`__jsllTrace.enter`) and stored in a generated local variable. Inner scopes pass the
// outer instance as their parent, so a closure keeps its defining scope alive exactly the way
// the engine does — captured scopes are visible without any runtime stack bookkeeping. Each
// statement reports `__jsllTrace.at(line, col, endLine, kind, instance)` before it runs; the
// runtime snapshots the chain of scopes (getters throw ReferenceError in the temporal dead zone,
// shown as "uninitialized"), the call stack and the reachable heap.
//
// Works with @babel/standalone 7 through `transformScript(path, source, { extraPlugins: [traceBabelPlugin] })`
// (shared/transform.js) for both the content build (node:vm, see exec-node.js) and the sandbox.

const RUNTIME = '__jsllTrace';
const STEP_KINDS = ['stmt', 'cond', 'iter', 'update', 'call', 'return', 'throw', 'await', 'resume', 'end'];
export { STEP_KINDS };

const BINDING_KINDS = { var: 'var', let: 'let', const: 'const', param: 'param', hoisted: 'function', local: 'function', module: 'import', unknown: 'let' };

/** Babel plugin factory. Options: { file?: string } (display name of the module). */
export function traceBabelPlugin({ types: t }, options = {}) {
  const rt = (method, args) => t.callExpression(t.memberExpression(t.identifier(RUNTIME), t.identifier(method)), args);
  const num = (n) => t.numericLiteral(n || 0);
  const str = (s) => t.stringLiteral(String(s ?? ''));

  return {
    name: 'jsll-trace',
    visitor: {
      Program(programPath) {
        if (programPath.node.__jsllTraced) return;
        programPath.node.__jsllTraced = true;
        const fileName = options.file || (this.file && this.file.opts && this.file.opts.filename ? String(this.file.opts.filename).replace(/^\//, '') : 'index.js');

        const scopeRefs = new Map(); // scope.uid → expression builder returning the instance
        const frameVars = new Map(); // function scope.uid → identifier of the frame variable
        const loopVars = new Map(); // ForStatement node → identifier of the per-iteration instance variable

        const registerRef = (scope, build) => scopeRefs.set(scope.uid, build);
        /** Expression for the nearest registered scope instance visible from `scope`. */
        const refFor = (scope) => {
          let s = scope;
          while (s) {
            const build = scopeRefs.get(s.uid);
            if (build) return build();
            s = s.parent;
          }
          return t.nullLiteral();
        };
        const refForParentOf = (scope) => (scope.parent ? refFor(scope.parent) : t.nullLiteral());

        const bindingEntries = (scope, { only = null, exclude = null } = {}) => {
          const out = [];
          for (const [name, binding] of Object.entries(scope.bindings)) {
            if (!binding.identifier || !binding.identifier.loc) continue; // helper bindings (loop guard etc.)
            if (only && !only.includes(binding.kind)) continue;
            if (exclude && exclude.includes(binding.kind)) continue;
            out.push({ name, kind: BINDING_KINDS[binding.kind] || 'let', line: binding.identifier.loc.start.line, col: binding.identifier.loc.start.column, isParam: binding.kind === 'param' });
          }
          out.sort((a, b) => (a.isParam === b.isParam ? a.line - b.line || a.col - b.col : a.isParam ? -1 : 1));
          return out;
        };
        const varsArray = (entries) => t.arrayExpression(entries.map((e) => t.arrayExpression([str(e.name), str(e.kind), t.arrowFunctionExpression([], t.identifier(e.name))])));
        const defObject = (fields) => t.objectExpression(Object.entries(fields).filter(([, v]) => v !== undefined).map(([k, v]) => t.objectProperty(t.identifier(k), v)));
        const hoistedRegistrations = (scope, instExpr) => bindingEntries(scope, { only: ['hoisted'] }).map((e) => t.expressionStatement(rt('fn', [t.identifier(e.name), instExpr])));

        const loc = (node) => node.loc;
        const atStatement = (node, kind, instExpr) => t.expressionStatement(rt('at', [num(node.loc.start.line), num(node.loc.start.column), num(node.loc.end.line), str(kind), instExpr]));
        const atExpression = (node, kind, instExpr) => rt('at', [num(node.loc.start.line), num(node.loc.start.column), num(node.loc.end.line), str(kind), instExpr]);

        const blockify = (path, key) => {
          const child = path.get(key);
          if (child.node && !child.isBlockStatement()) child.replaceWith(t.blockStatement([child.node]));
        };
        const functionName = (path) => {
          const node = path.node;
          if (node.id && node.id.name) return node.id.name;
          if (path.isObjectMethod() || path.isClassMethod() || path.isClassPrivateMethod()) {
            const key = node.key;
            const base = t.isIdentifier(key) ? key.name : t.isStringLiteral(key) ? key.value : t.isPrivateName(key) ? `#${key.id.name}` : 'method';
            if (node.kind === 'get' || node.kind === 'set') return `${node.kind} ${base}`;
            if (node.kind === 'constructor') {
              const cls = path.findParent((p) => p.isClass());
              return cls && cls.node.id ? `new ${cls.node.id.name}` : 'constructor';
            }
            return base;
          }
          const parent = path.parentPath;
          if (parent.isVariableDeclarator() && t.isIdentifier(parent.node.id)) return parent.node.id.name;
          if (parent.isAssignmentExpression() && t.isIdentifier(parent.node.left)) return parent.node.left.name;
          if (parent.isObjectProperty() && t.isIdentifier(parent.node.key)) return parent.node.key.name;
          if (parent.isClassProperty() && t.isIdentifier(parent.node.key)) return parent.node.key.name;
          if (parent.isCallExpression() && parent.node.callee && t.isMemberExpression(parent.node.callee) && t.isIdentifier(parent.node.callee.property)) {
            return `${parent.node.callee.property.name} callback`;
          }
          return '(anonymous)';
        };
        /**
         * The `name` the engine gives an anonymous function or arrow expression from its position
         * (NamedEvaluation): `const f = () => …`, `f = …`, `{ f: … }`, class fields, defaults,
         * `export default`. Unlike functionName() this never invents a display name ("map callback").
         * Wrapping the expression in __jsllTrace.fn(…) defeats the engine's inference, so the runtime
         * restores exactly this name.
         */
        const inferredName = (path) => {
          const node = path.node;
          if (node.id) return null;
          const parent = path.parentPath;
          const keyName = (key, computed) => {
            if (computed) return null;
            if (t.isIdentifier(key)) return key.name;
            if (t.isStringLiteral(key)) return key.value;
            if (t.isNumericLiteral(key)) return String(key.value);
            if (t.isPrivateName(key)) return `#${key.id.name}`;
            return null;
          };
          if (parent.isVariableDeclarator() && parent.node.init === node && t.isIdentifier(parent.node.id)) return parent.node.id.name;
          if (parent.isAssignmentExpression() && parent.node.right === node && t.isIdentifier(parent.node.left) && ['=', '||=', '&&=', '??='].includes(parent.node.operator)) return parent.node.left.name;
          if (parent.isAssignmentPattern() && parent.node.right === node && t.isIdentifier(parent.node.left)) return parent.node.left.name;
          if (parent.isObjectProperty() && parent.node.value === node) return keyName(parent.node.key, parent.node.computed);
          if ((parent.isClassProperty() || parent.isClassPrivateProperty()) && parent.node.value === node) return keyName(parent.node.key, parent.node.computed);
          if (parent.isExportDefaultDeclaration()) return 'default';
          return null;
        };
        const usesThis = (fnPath) => {
          if (fnPath.isArrowFunctionExpression()) return false;
          let found = false;
          fnPath.traverse({
            ThisExpression(p) { found = true; p.stop(); },
            Function(p) { if (!p.isArrowFunctionExpression()) p.skip(); },
          });
          return found;
        };

        // ---- phase 0: give every branch/loop body and arrow body a block, so scopes are final ----
        programPath.traverse({
          IfStatement(path) { blockify(path, 'consequent'); if (path.node.alternate && !path.get('alternate').isIfStatement()) blockify(path, 'alternate'); },
          'WhileStatement|DoWhileStatement|ForStatement|ForOfStatement|ForInStatement'(path) { blockify(path, 'body'); },
          LabeledStatement(path) { if (!path.get('body').isBlockStatement() && !path.get('body').isLoop()) blockify(path, 'body'); },
          ArrowFunctionExpression(path) {
            if (!path.get('body').isBlockStatement()) {
              const body = path.node.body;
              const ret = t.returnStatement(body);
              ret.loc = body.loc;
              path.get('body').replaceWith(t.blockStatement([ret]));
            }
          },
        });

        // ---- phase 1: decide instance variables for every scope that gets registered ----
        {
          const fr0 = programPath.scope.generateUidIdentifier('fr');
          frameVars.set(programPath.scope.uid, fr0);
          registerRef(programPath.scope, () => t.memberExpression(t.cloneNode(fr0), t.identifier('scope')));
        }
        programPath.traverse({
          Scopable(path) {
            const scope = path.scope;
            if (scopeRefs.has(scope.uid)) return;
            if (path.isFunction()) {
              const fr = scope.generateUidIdentifier('fr');
              frameVars.set(scope.uid, fr);
              registerRef(scope, () => t.memberExpression(t.cloneNode(fr), t.identifier('scope')));
              return;
            }
            if (path.isForStatement()) {
              if (bindingEntries(scope).length === 0) return;
              const v = scope.parent.generateUidIdentifier('f');
              loopVars.set(path.node, v);
              registerRef(scope, () => t.cloneNode(v));
              return;
            }
            if (path.isBlockStatement() || path.isCatchClause() || path.isForOfStatement() || path.isForInStatement()) {
              // for-of / for-in heads share one display scope with their body block.
              if ((path.isForOfStatement() || path.isForInStatement()) && path.get('body').isBlockStatement()) {
                const bodyScope = path.get('body').scope;
                if (bindingEntries(scope).length + bindingEntries(bodyScope).length === 0) return;
                const v = scope.generateUidIdentifier('s');
                registerRef(scope, () => t.cloneNode(v));
                registerRef(bodyScope, () => t.cloneNode(v));
                return;
              }
              if (path.isCatchClause()) {
                if (bindingEntries(scope).length === 0) return;
                const v = scope.generateUidIdentifier('s');
                registerRef(scope, () => t.cloneNode(v));
                return;
              }
              if (path.isBlockStatement()) {
                if (bindingEntries(scope).length === 0) return;
                const v = scope.generateUidIdentifier('s');
                registerRef(scope, () => t.cloneNode(v));
              }
            }
            // switch and class scopes are not registered: their statements use the enclosing scope.
          },
        });

        // ---- phase 2: instrument (post-order: children first, then the node itself) ----
        const isOwn = (node) => !node.loc;
        // ReturnStatement is not listed: the 'return' step (emitted after the value is computed) is its step.
        const statementKinds = new Set(['ExpressionStatement', 'VariableDeclaration', 'IfStatement', 'ThrowStatement', 'ClassDeclaration', 'TryStatement', 'BreakStatement', 'ContinueStatement', 'SwitchStatement', 'ExportNamedDeclaration', 'ExportDefaultDeclaration', 'DoWhileStatement', 'WhileStatement', 'ForStatement', 'ForOfStatement', 'ForInStatement']);
        const noStep = new Set(['WhileStatement', 'DoWhileStatement', 'ForStatement', 'TryStatement', 'ForOfStatement', 'ForInStatement']);

        programPath.traverse({
          Statement: {
            exit(path) {
              const node = path.node;
              if (isOwn(node) || node.__jsllStep || !statementKinds.has(node.type) || noStep.has(node.type)) return;
              if (path.parentPath.isExportNamedDeclaration() || path.parentPath.isExportDefaultDeclaration()) return;
              if (path.key === 'init' || (path.parentPath.isForXStatement() && path.key === 'left')) return;
              if (path.isVariableDeclaration() && !path.parentPath.isBlockStatement() && !path.parentPath.isProgram() && !path.parentPath.isSwitchCase() && !path.parentPath.isExportNamedDeclaration()) return;
              node.__jsllStep = true;
              const kind = path.isIfStatement() ? 'cond' : 'stmt';
              path.insertBefore(atStatement(node, kind, refFor(path.scope)));
            },
          },
          'WhileStatement|DoWhileStatement': {
            exit(path) {
              const test = path.node.test;
              if (!test.loc || test.__jsllStep) return;
              test.__jsllStep = true;
              path.node.test = t.sequenceExpression([atExpression(path.node, 'cond', refFor(path.scope)), test]);
            },
          },
          ForStatement: {
            exit(path) {
              const node = path.node;
              if (node.__jsllDone) return;
              node.__jsllDone = true;
              const v = loopVars.get(node);
              const parentRef = v ? refForParentOf(path.scope) : refFor(path.scope);
              const headVars = v ? varsArray(bindingEntries(path.scope)) : null;
              const def = () => defObject({ kind: str('loop'), name: str('for'), line: num(node.loc.start.line), vars: headVars });
              const reenter = () => t.assignmentExpression('=', t.cloneNode(v), rt('loop', [def(), t.cloneNode(v), parentRef]));
              const instRef = () => (v ? t.cloneNode(v) : refFor(path.scope));
              const testParts = v ? [reenter()] : [];
              testParts.push(atExpression(node, 'cond', instRef()));
              testParts.push(node.test || t.booleanLiteral(true));
              node.test = t.sequenceExpression(testParts);
              const updateParts = [atExpression(node.update || node, 'update', instRef())];
              if (node.update) updateParts.push(node.update);
              node.update = t.sequenceExpression(updateParts);
              if (v) {
                const init = node.init;
                if (t.isVariableDeclaration(init) && init.kind === 'let') {
                  // The instance variable joins the `let` head, so the engine copies it into every
                  // iteration's environment together with the loop variables: a closure created in
                  // iteration k keeps seeing iteration k's instance (and thus its own `i`), exactly
                  // like it keeps its own `i`. Declared outside the loop it would hold the last
                  // instance by the time the closure runs.
                  init.declarations.push(t.variableDeclarator(t.cloneNode(v), t.nullLiteral()));
                } else {
                  // `const` heads have no per-iteration copies: one environment, one variable.
                  let anchor = path;
                  while (anchor.parentPath && anchor.parentPath.isLabeledStatement()) anchor = anchor.parentPath;
                  anchor.insertBefore(t.variableDeclaration('let', [t.variableDeclarator(t.cloneNode(v), t.nullLiteral())]));
                }
              }
            },
          },
          'ForOfStatement|ForInStatement': {
            exit(path) {
              const node = path.node;
              if (node.__jsllDone) return;
              node.__jsllDone = true;
              const body = path.get('body');
              const build = scopeRefs.get(path.scope.uid);
              const prelude = [];
              if (build) {
                const entries = [...bindingEntries(path.scope), ...bindingEntries(body.scope).filter((e) => !bindingEntries(path.scope).some((h) => h.name === e.name))];
                const def = defObject({ kind: str('loop'), name: str(path.isForOfStatement() ? 'for…of' : 'for…in'), line: num(node.loc.start.line), vars: varsArray(entries) });
                prelude.push(t.variableDeclaration('const', [t.variableDeclarator(build(), rt('enter', [def, refForParentOf(path.scope)]))]));
                prelude.push(...hoistedRegistrations(body.scope, build()));
              }
              prelude.push(atStatement(node, 'iter', build ? build() : refFor(path.scope)));
              body.unshiftContainer('body', prelude);
              // The iterated expression runs before the first `iter` step and may call functions:
              // move the frame to the loop line first (no step), as for return expressions.
              const owner = path.getFunctionParent();
              const fr = frameVars.get(owner ? owner.scope.uid : programPath.scope.uid);
              if (fr && node.right && node.right.loc) node.right = t.sequenceExpression([rt('pos', [t.cloneNode(fr), num(node.loc.start.line), refForParentOf(path.scope)]), node.right]);
            },
          },
          BlockStatement: {
            exit(path) {
              const node = path.node;
              if (node.__jsllDone) return;
              node.__jsllDone = true;
              const parent = path.parentPath;
              if (parent.isFunction() || parent.isForXStatement()) return; // handled with their owner
              const scope = parent.isCatchClause() ? parent.scope : path.scope;
              const build = scopeRefs.get(scope.uid);
              if (!build) return;
              const kind = parent.isCatchClause() ? 'catch' : 'block';
              const def = defObject({ kind: str(kind), name: str(kind === 'catch' ? 'catch' : ''), line: num(node.loc ? node.loc.start.line : 0), vars: varsArray(bindingEntries(scope)) });
              const prelude = [t.variableDeclaration('const', [t.variableDeclarator(build(), rt('enter', [def, refForParentOf(scope)]))]), ...hoistedRegistrations(scope, build())];
              path.unshiftContainer('body', prelude);
            },
          },
          ReturnStatement: {
            exit(path) {
              const node = path.node;
              if (node.__jsllDone || !node.loc) return;
              node.__jsllDone = true;
              const fn = path.getFunctionParent();
              if (!fn) return;
              const fr = frameVars.get(fn.scope.uid);
              if (!fr) return;
              // A return statement has no step of its own, but its expression may call functions:
              // `pos` first moves this frame to the return line (no step), so while `b` runs in
              // `return a(b(x))` the waiting caller frame points at the return, not the previous line.
              const value = t.sequenceExpression([rt('pos', [t.cloneNode(fr), num(node.loc.start.line), refFor(path.scope)]), node.argument || t.identifier('undefined')]);
              node.argument = rt('returning', [t.cloneNode(fr), value, num(node.loc.start.line), num(node.loc.start.column)]);
            },
          },
          AwaitExpression: {
            exit(path) {
              const node = path.node;
              if (node.__jsllDone || !node.loc) return;
              node.__jsllDone = true;
              const fn = path.getFunctionParent();
              const fr = frameVars.get(fn ? fn.scope.uid : programPath.scope.uid);
              if (!fr) return;
              const inner = t.awaitExpression(rt('suspend', [t.cloneNode(fr), node.argument]));
              inner.__jsllDone = true;
              path.replaceWith(rt('resume', [t.cloneNode(fr), inner]));
            },
          },
          Function: {
            exit(path) {
              const node = path.node;
              if (node.__jsllDone) return;
              node.__jsllDone = true;
              const fr = frameVars.get(path.scope.uid);
              if (!fr) return;
              const body = path.get('body');
              if (!body.isBlockStatement()) return;
              const entries = bindingEntries(path.scope);
              if (usesThis(path)) entries.push({ name: 'this', kind: 'this', line: 0, col: 0 });
              const vars = t.arrayExpression(entries.map((e) => t.arrayExpression([str(e.name), str(e.kind), t.arrowFunctionExpression([], e.name === 'this' ? t.thisExpression() : t.identifier(e.name))])));
              const parentRef = refForParentOf(path.scope);
              const def = defObject({ kind: str('function'), name: str(functionName(path)), line: num(node.loc ? node.loc.start.line : 0), endLine: num(node.loc ? node.loc.end.line : 0), vars });
              // The frame is created *inside* the try block so that the binding getters live in the
              // same block as the body's let/const/class declarations (a try block is its own scope).
              const prelude = [
                t.expressionStatement(t.assignmentExpression('=', t.cloneNode(fr), rt('call', [def, parentRef]))),
                ...hoistedRegistrations(path.scope, t.memberExpression(t.cloneNode(fr), t.identifier('scope'))),
              ];
              const err = path.scope.generateUidIdentifier('e');
              const guarded = t.tryStatement(
                t.blockStatement([...prelude, ...body.node.body]),
                t.catchClause(err, t.blockStatement([t.expressionStatement(rt('threw', [t.cloneNode(fr), t.cloneNode(err)])), t.throwStatement(t.cloneNode(err))])),
                t.blockStatement([t.expressionStatement(rt('leave', [t.cloneNode(fr)]))]),
              );
              // Directives ("use strict") stay in body.directives, so the declaration is the first statement.
              body.node.body = [t.variableDeclaration('let', [t.variableDeclarator(t.cloneNode(fr), t.nullLiteral())]), guarded];
              // Function values remember the scope they were created in (closure link in the heap)
              // and keep the name the engine would have inferred without the wrapper.
              if ((path.isFunctionExpression() || path.isArrowFunctionExpression()) && node.loc && !node.__jsllWrapped) {
                node.__jsllWrapped = true;
                const name = inferredName(path);
                path.replaceWith(rt('fn', [node, refForParentOf(path.scope), ...(name ? [str(name)] : [])]));
              }
            },
          },
        });

        // ---- the module itself is frame 0 ----
        const scope = programPath.scope;
        const fr = frameVars.get(scope.uid);
        const def = defObject({ kind: str('module'), name: str(fileName), file: str(fileName), line: num(1), vars: varsArray(bindingEntries(scope)) });
        const prelude = [
          t.variableDeclaration('const', [t.variableDeclarator(t.cloneNode(fr), rt('call', [def, t.nullLiteral()]))]),
          ...hoistedRegistrations(scope, t.memberExpression(t.cloneNode(fr), t.identifier('scope'))),
        ];
        const original = programPath.node.body.filter((n) => n.loc);
        const lastLine = original.length > 0 ? original[original.length - 1].loc.end.line : 1;
        programPath.unshiftContainer('body', prelude);
        programPath.pushContainer('body', t.expressionStatement(rt('end', [t.cloneNode(fr), num(lastLine)])));
      },
    },
  };
}

/** Transform + run source in Node and return the trace (build time). Node-only: loads exec-node.js lazily. */
export async function traceSource(source, options = {}) {
  const { loadExec } = await import('./exec.js');
  const { runTraced } = await loadExec();
  return runTraced(source, options);
}
