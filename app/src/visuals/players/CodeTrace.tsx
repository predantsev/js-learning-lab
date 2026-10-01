import { useMemo } from 'react';
import type { PlayerProps } from '../VisualPlayer';
import type { CodeTraceSpec, TraceFrame, TraceScope, TraceStep, Heap } from '../types';
import type { VisualLabels } from '../labels';
import { CodeView } from '../CodeView';
import { HeapEntryView, Value, valueText } from '../ValueView';

type ScopeView = { scope: TraceScope; captured: boolean };

/** Scope chain of the active frame: own block/function scopes, then captured scopes, then the module. */
export function scopeChain(step: TraceStep): ScopeView[] {
  const out: ScopeView[] = [];
  let id = step.scope;
  let passedFunction = false;
  const seen = new Set<number>();
  while (id !== null && step.scopes[String(id)] && !seen.has(id)) {
    seen.add(id);
    const scope = step.scopes[String(id)];
    const isModule = scope.kind === 'module';
    out.push({ scope, captured: passedFunction && !isModule });
    if (scope.kind === 'function') passedFunction = true;
    id = scope.parent;
  }
  return out;
}

export function scopeTitle(view: ScopeView, labels: VisualLabels): string {
  const { scope, captured } = view;
  if (scope.kind === 'module') return `${labels.module} ${scope.name}`.trim();
  const base = scope.kind === 'function' ? `${labels.function} ${scope.name}` : scope.kind === 'loop' ? `${labels.loop} ${scope.name}` : scope.kind === 'catch' ? labels.catch : labels.block;
  return captured ? `${labels.captured}: ${base}` : base;
}

function scopeNameById(step: TraceStep, id: number | string | null): string | null {
  if (id === null || id === undefined) return null;
  const scope = step.scopes[String(id)];
  if (!scope) return `#${id}`;
  return scope.kind === 'module' ? scope.name : scope.name || scope.kind;
}

export function changedVars(current: TraceStep, previous: TraceStep | null): Set<string> {
  const changed = new Set<string>();
  if (!previous) return changed;
  for (const scope of Object.values(current.scopes)) {
    const old = previous.scopes[String(scope.id)];
    for (const v of scope.vars) {
      const before = old?.vars.find((x) => x.name === v.name);
      if (!before || JSON.stringify(before) !== JSON.stringify(v)) changed.add(`${scope.id}:${v.name}`);
    }
  }
  return changed;
}

/** True for a frame of a called function; false for the frame of the module (top-level code). */
function isCallFrame(step: TraceStep, frame: TraceFrame): boolean {
  let id = frame.scope;
  const seen = new Set<number>();
  while (id !== null && step.scopes[String(id)] && !seen.has(id)) {
    seen.add(id);
    const scope = step.scopes[String(id)];
    if (scope.kind === 'module') return false;
    if (scope.kind === 'function') return true;
    id = scope.parent;
  }
  return true; // unknown: keep the call stack visible
}

/** Which panels have something to show in at least one step; a panel empty in every step is hidden. */
export function usedPanels(steps: CodeTraceSpec['steps']): { variables: boolean; callStack: boolean; heap: boolean } {
  return {
    variables: steps.some(({ trace }) => scopeChain(trace).some(({ scope }) => scope.vars.length > 0)),
    callStack: steps.some(({ trace }) => trace.frames.some((f) => isCallFrame(trace, f))),
    heap: steps.some(({ trace }) => Object.keys(trace.heap).length > 0),
  };
}

export function changedHeap(current: Heap, previous: Heap | null): Set<string> {
  const changed = new Set<string>();
  for (const [id, entry] of Object.entries(current)) if (!previous || !previous[id] || JSON.stringify(previous[id]) !== JSON.stringify(entry)) changed.add(id);
  return changed;
}

export function EventLine({ step, labels, heap }: { step: TraceStep; labels: VisualLabels; heap: Heap }) {
  const e = step.event;
  if (!e) return null;
  let text: string;
  let cls = '';
  switch (e.type) {
    case 'call': text = `→ ${labels.call} ${e.name}(${e.args.map((a) => `${a.name} = ${valueText(a.value, heap, labels)}`).join(', ')})`; break;
    case 'return': text = `← ${e.name} ${labels.returns} ${valueText(e.value, heap, labels)}`; break;
    case 'throw': text = `✖ ${e.uncaught ? `${labels.uncaught}: ` : `${labels.throws} `}${e.error.name}: ${e.error.message}`; cls = ' viz-event-error'; break;
    case 'await': text = `⏸ ${e.name} ${labels.awaits}`; break;
    case 'resume': text = `▶ ${e.name} ${labels.resumes}`; break;
    case 'end': text = `■ ${labels.finished}`; break;
    default: return null;
  }
  return <p className={`viz-event${cls}`} data-role="event">{text}</p>;
}

export function CodeTrace({ spec, index, tick, labels }: PlayerProps<CodeTraceSpec>) {
  const current = spec.steps[index];
  const previous = index > 0 ? spec.steps[index - 1].trace : null;
  const step = current.trace;
  const chain = scopeChain(step);
  const changed = changedVars(step, previous);
  const heapChanged = changedHeap(step.heap, previous ? previous.heap : null);
  const frames = [...step.frames].reverse();
  const context = step.frames.slice(0, -1).map((f) => f.line).filter((l) => l > 0);
  const consoleEntries = spec.console.slice(0, current.logged);
  const heapIds = Object.keys(step.heap);
  const used = useMemo(() => usedPanels(spec.steps), [spec.steps]);
  return (
    <div className="viz-grid viz-code-trace">
      <CodeView code={spec.code} currentLine={step.line} context={context} label={labels.code} currentLabel={labels.lineN} file={spec.file} flashKey={tick} />
      <EventLine step={step} labels={labels} heap={step.heap} />
      {spec.truncated && index === spec.steps.length - 1 ? <p className="viz-note">{labels.truncated}</p> : null}
      {(used.variables || used.callStack || used.heap) && <div className={used.variables && (used.callStack || used.heap) ? 'viz-columns' : 'viz-columns viz-columns-single'}>
        {used.variables && <section className="viz-panel" aria-label={labels.variables}>
          <header className="viz-panel-head"><span>{labels.variables}</span></header>
          {chain.map(({ scope, captured }) => (
            <div key={scope.id} className={`viz-scope${captured ? ' viz-scope-captured' : ''} viz-scope-${scope.kind}`} data-scope={scope.id}>
              <h4 className="viz-scope-title">{scopeTitle({ scope, captured }, labels)}{scope.kind === 'loop' && (scope as TraceScope & { iteration?: number }).iteration ? ` · ${labels.iteration((scope as TraceScope & { iteration?: number }).iteration ?? 0)}` : ''}</h4>
              {scope.vars.length === 0 ? <p className="viz-dim viz-small">{labels.empty}</p> : (
                <table className="viz-table viz-vars">
                  <tbody>
                    {scope.vars.map((v) => {
                      const key = `${scope.id}:${v.name}`;
                      const flash = changed.has(key);
                      return (
                        <tr key={flash ? `${key}-${tick}` : key} className={flash ? 'viz-row-changed' : undefined}>
                          <th scope="row"><code>{v.name}</code> <span className="viz-kind">{v.kind}</span></th>
                          <td>
                            {v.uninit ? <span className={`viz-value viz-uninit${flash ? ' viz-changed' : ''}`}>{labels.uninitialized}</span> : <Value value={v.value} heap={step.heap} labels={labels} flash={flash} />}
                            {flash ? <span className="viz-sr"> ({labels.changed})</span> : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </section>}
        {(used.callStack || used.heap) && <div className="viz-stack-col">
          {used.callStack && <section className="viz-panel" aria-label={labels.callStack}>
            <header className="viz-panel-head"><span>{labels.callStack}</span></header>
            <ol className="viz-frames" reversed>
              {frames.map((f, i) => (
                <li key={f.id} className={`viz-frame${i === 0 ? ' viz-frame-top' : ''}`}><code>{f.name}</code> <span className="viz-dim viz-small">{labels.lineN(f.line)}</span></li>
              ))}
              {frames.length === 0 ? <li className="viz-dim viz-small">{labels.empty}</li> : null}
            </ol>
          </section>}
          {used.heap && <section className="viz-panel" aria-label={labels.heap}>
            <header className="viz-panel-head"><span>{labels.heap}</span></header>
            {heapIds.length === 0 ? <p className="viz-dim viz-small">{labels.empty}</p> : (
              <div className="viz-heap">
                {heapIds.map((id) => {
                  const entry = step.heap[id];
                  const flash = heapChanged.has(id);
                  return <HeapEntryView key={flash ? `${id}-${tick}` : id} id={id} entry={entry} heap={step.heap} labels={labels} flash={flash} scopeName={entry.t === 'function' || entry.t === 'class' ? entry.scopeName ?? scopeNameById(step, entry.scope) : null} />;
                })}
                {step.heapTruncated ? <p className="viz-dim viz-small">…</p> : null}
              </div>
            )}
          </section>}
        </div>}
      </div>}
      <section className="viz-panel viz-console" aria-label={labels.console}>
        <header className="viz-panel-head"><span>{labels.console}</span></header>
        <ol className="viz-console-list" data-role="console">
          {consoleEntries.map((e, i) => <li key={i} className={`viz-console-${e.level}${i === consoleEntries.length - 1 && previous && current.logged > spec.steps[index - 1].logged ? ' viz-changed' : ''}`}><code>{e.text}</code></li>)}
          {consoleEntries.length === 0 ? <li className="viz-dim viz-small">{labels.empty}</li> : null}
        </ol>
      </section>
    </div>
  );
}
