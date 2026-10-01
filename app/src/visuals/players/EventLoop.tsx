import type { PlayerProps } from '../VisualPlayer';
import type { EventLoopSpec } from '../types';
import { CodeView } from '../CodeView';

function Queue({ title, items, previous, tick, emptyLabel, stackLike = false }: { title: string; items: string[]; previous: string[]; tick: number; emptyLabel: string; stackLike?: boolean }) {
  const shown = stackLike ? [...items].reverse() : items;
  return (
    <section className={`viz-panel viz-queue${stackLike ? ' viz-queue-stack' : ''}`} aria-label={title}>
      <header className="viz-panel-head"><span>{title}</span><span className="viz-dim viz-small">{items.length}</span></header>
      <ol className="viz-queue-list" aria-label={title} data-role={title}>
        {shown.map((item, i) => {
          const isNew = !previous.includes(item) || previous.filter((p) => p === item).length < items.filter((p) => p === item).length;
          return <li key={isNew ? `${item}-${i}-${tick}` : `${item}-${i}`} className={`viz-queue-item${isNew ? ' viz-changed' : ''}`}><code>{item}</code></li>;
        })}
        {items.length === 0 ? <li className="viz-queue-empty viz-dim viz-small">{emptyLabel}</li> : null}
      </ol>
    </section>
  );
}

export function EventLoop({ spec, index, tick, labels }: PlayerProps<EventLoopSpec>) {
  const step = spec.steps[index];
  const previous = index > 0 ? spec.steps[index - 1] : { stack: [], microtasks: [], tasks: [], webApis: [], logged: 0 };
  const consoleEntries = spec.console.slice(0, step.logged);
  return (
    <div className="viz-grid viz-event-loop">
      <CodeView code={spec.code} currentLine={step.line} label={labels.code} currentLabel={labels.lineN} file={spec.file} flashKey={tick} maxLines={12} />
      <div className="viz-loop-grid">
        <Queue title={labels.callStack} items={step.stack} previous={previous.stack} tick={tick} emptyLabel={labels.empty} stackLike />
        <Queue title={labels.webApis} items={step.webApis} previous={previous.webApis} tick={tick} emptyLabel={labels.empty} />
        <Queue title={labels.microtasks} items={step.microtasks} previous={previous.microtasks} tick={tick} emptyLabel={labels.empty} />
        <Queue title={labels.tasks} items={step.tasks} previous={previous.tasks} tick={tick} emptyLabel={labels.empty} />
      </div>
      <section className="viz-panel viz-console" aria-label={labels.console}>
        <header className="viz-panel-head"><span>{labels.console}</span></header>
        <ol className="viz-console-list" data-role="console">
          {consoleEntries.map((e, i) => <li key={i >= previous.logged ? `${i}-${tick}` : i} className={`viz-console-${e.level}${i >= previous.logged ? ' viz-changed' : ''}`}><code>{e.text}</code></li>)}
          {consoleEntries.length === 0 ? <li className="viz-dim viz-small">{labels.empty}</li> : null}
        </ol>
      </section>
    </div>
  );
}
