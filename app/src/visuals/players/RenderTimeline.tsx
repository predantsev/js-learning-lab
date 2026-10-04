import type { PlayerProps } from '../VisualPlayer';
import type { RenderTimelineSpec } from '../types';
import { CodeView } from '../CodeView';

const show = (v: unknown): string => (typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v) ?? 'undefined');

function Values({ title, values, previous, tick }: { title: string; values: Record<string, unknown>; previous: Record<string, unknown> | null; tick: number }) {
  const entries = Object.entries(values);
  if (entries.length === 0) return null;
  return (
    <table className="viz-table viz-vars">
      <caption className="viz-small viz-dim">{title}</caption>
      <tbody>
        {entries.map(([k, v]) => {
          const changed = previous ? show(previous[k]) !== show(v) : false;
          return <tr key={changed ? `${k}-${tick}` : k} className={changed ? 'viz-row-changed' : undefined}><th scope="row"><code>{k}</code></th><td><code className={changed ? 'viz-changed' : undefined}>{show(v)}</code></td></tr>;
        })}
      </tbody>
    </table>
  );
}

export function RenderTimeline({ spec, index, tick, labels, lang }: PlayerProps<RenderTimelineSpec>) {
  const step = spec.steps[index];
  const prev = index > 0 ? spec.steps[index - 1] : null;
  const code = spec.code ? spec.code.replace(/\n$/, '') : null;
  // React Native lessons show native views here (the preview draws them with react-native-web).
  const screen = spec.screen === 'native' ? labels.domNative : labels.dom;
  // Timeline cells: one per step, grouped by render; the current step is marked.
  const cells = spec.steps.map((s, i) => ({ i, phase: s.phase, render: s.render, label: s.phase === 'render' ? labels.render(s.render) : s.phase === 'commit' ? labels.commit : s.phase === 'effect' ? labels.effects : s.phase === 'event' ? labels.event(s.event?.name ?? '') : labels.idle }));
  const phaseTitle = step.phase === 'render' ? labels.render(step.render) : step.phase === 'commit' ? `${labels.commit} · ${labels.render(step.render)}` : step.phase === 'effect' ? `${labels.effects} · ${labels.render(step.render)}` : step.phase === 'event' ? labels.event(step.event?.name ?? '') : labels.idle;
  return (
    <div className="viz-grid viz-render-timeline">
      {code ? <CodeView code={code} currentLine={step.line} label={`${labels.code} · ${spec.component}`} currentLabel={labels.lineN} flashKey={tick} maxLines={12} /> : null}
      <ol className="viz-timeline" aria-label={labels.timeline}>
        {cells.map((c) => (
          <li key={c.i} className={`viz-tl-cell viz-tl-${c.phase}${c.i === index ? ' viz-tl-current' : c.i < index ? ' viz-tl-done' : ''}`} aria-current={c.i === index ? 'step' : undefined} data-render={c.render}>
            <span className="viz-tl-label">{c.label}</span>
          </li>
        ))}
      </ol>
      <div className="viz-columns">
        <section className="viz-panel" aria-label={labels.renderSees(step.render)}>
          <header className="viz-panel-head"><span key={`${phaseTitle}-${tick}`} className="viz-changed">{phaseTitle}</span></header>
          {step.phase === 'render' && step.reason ? <p className="viz-small viz-dim"><span>{labels.reason}: </span><span dangerouslySetInnerHTML={{ __html: step.reason[lang] }} /></p> : null}
          {step.snapshot ? (
            <div className="viz-snapshot">
              <h4 className="viz-scope-title">{labels.renderSees(step.render)}</h4>
              <Values title={labels.props} values={step.snapshot.props} previous={prev?.snapshot?.props ?? null} tick={tick} />
              <Values title={labels.state} values={step.snapshot.state} previous={prev?.snapshot?.state ?? null} tick={tick} />
            </div>
          ) : null}
          {step.phase === 'event' && step.event ? (
            <div className="viz-event-panel">
              <h4 className="viz-scope-title">{labels.sees}</h4>
              <Values title={labels.state} values={step.event.sees} previous={null} tick={tick} />
              <h4 className="viz-scope-title">{labels.actions}</h4>
              <ol className="viz-actions">{step.event.actions.map((a, i) => <li key={`${i}-${tick}`} className="viz-changed"><code>{a}</code></li>)}</ol>
              {step.event.queued ? (<><h4 className="viz-scope-title">{labels.queued}</h4><Values title={labels.state} values={step.event.queued} previous={null} tick={tick} /></>) : null}
            </div>
          ) : null}
          {step.phase === 'effect' ? (
            <div className="viz-effects">
              {(step.cleanup ?? []).length > 0 ? (<><h4 className="viz-scope-title">{labels.cleanup}</h4><ol className="viz-actions">{(step.cleanup ?? []).map((a, i) => <li key={`c${i}-${tick}`} className="viz-changed"><code>{a}</code></li>)}</ol></>) : null}
              <h4 className="viz-scope-title">{labels.run}</h4>
              <ol className="viz-actions">{(step.run ?? []).map((a, i) => <li key={`r${i}-${tick}`} className="viz-changed"><code>{a}</code></li>)}{(step.run ?? []).length === 0 ? <li className="viz-dim viz-small">{labels.noChange}</li> : null}</ol>
            </div>
          ) : null}
        </section>
        <section className="viz-panel viz-dom" aria-label={screen}>
          <header className="viz-panel-head"><span>{screen}</span></header>
          <div className="viz-screen">
            {step.dom ? <code key={step.dom !== (prev?.dom ?? null) ? `${step.dom}-${tick}` : step.dom} className={step.dom !== (prev?.dom ?? null) ? 'viz-changed' : undefined}>{step.dom}</code> : <span className="viz-dim viz-small">{labels.empty}</span>}
          </div>
        </section>
      </div>
    </div>
  );
}
