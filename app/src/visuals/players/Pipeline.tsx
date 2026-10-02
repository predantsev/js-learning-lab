import type { PlayerProps } from '../VisualPlayer';
import type { Lang, PipelineCompare, PipelineLabel, PipelineOutput, PipelineSpec, PipelineStatus } from '../types';
import type { VisualLabels } from '../labels';
import { CodeView } from '../CodeView';

const STATUS_MARK: Record<PipelineStatus, string> = { in: '', waiting: '', kept: '✓', dropped: '✕', mapped: '→', consumed: '+', moved: '↕', skipped: '–', match: '✓', nomatch: '✕', error: '!' };

function statusLabel(status: PipelineStatus, labels: VisualLabels): string {
  switch (status) {
    case 'kept': return labels.kept;
    case 'dropped': return labels.dropped;
    case 'waiting': return labels.waiting;
    case 'mapped': return labels.mapped;
    case 'consumed': return labels.consumed;
    case 'moved': return labels.moved;
    case 'skipped': return labels.skipped;
    case 'match': return labels.match;
    case 'nomatch': return labels.nomatch;
    case 'error': return labels.threw;
    default: return '';
  }
}

/** An item label in the current language (labels from a bilingual `show` carry both). */
const labelText = (label: PipelineLabel | undefined, lang: Lang): string => (label === undefined ? '' : typeof label === 'string' ? label : label[lang] ?? label.uk);

function compareMeaning(compare: PipelineCompare, labels: VisualLabels): string {
  switch (compare.order) {
    case 'a-first': return labels.aFirst;
    case 'b-first': return labels.bFirst;
    case 'keep': return labels.keepOrder;
    default: return labels.threw;
  }
}

function outputText(output: PipelineOutput, lang: Lang, labels: VisualLabels): string {
  switch (output.kind) {
    case 'list': return output.items.map((i) => labelText(i.label, lang)).join(', ');
    case 'value': return labelText(output.label, lang);
    case 'pending': return labels.pending;
    default: return `${labels.threw}: ${output.name}: ${output.message}`;
  }
}

export function Pipeline({ spec, index, tick, labels, lang }: PlayerProps<PipelineSpec>) {
  const step = spec.steps[index];
  const previous = index > 0 ? spec.steps[index - 1] : null;
  const stage = step.stage >= 0 ? spec.stages[step.stage] : null;
  const code = spec.code ? spec.code.replace(/\n$/, '') : null;
  const prevStatus = new Map((previous && previous.stage === step.stage ? previous.items : []).map((i) => [i.id, i.status]));
  const prevOutIds = new Set(previous && previous.stage === step.stage && previous.output && previous.output.kind === 'list' ? previous.output.items.map((i) => i.id) : []);
  const compare = step.compare ?? null;
  const compareRole = (id: string) => (compare ? (compare.a === id ? 'a' : compare.b === id ? 'b' : null) : null);
  const itemById = new Map(step.items.map((i) => [i.id, i]));
  const summaryText = `${stage ? `${stage.op}(${stage.fn}): ` : `${labels.input}: `}${step.items.map((i) => `${labelText(i.label, lang)}${i.status !== 'in' && i.status !== 'waiting' ? ` (${statusLabel(i.status, labels)})` : ''}`).join(', ')}${compare ? `. ${labels.comparison(compare.index, compare.count)}: a = ${labelText(itemById.get(compare.a)?.label, lang)}, b = ${labelText(itemById.get(compare.b)?.label, lang)} → ${compare.result} (${compareMeaning(compare, labels)})` : ''}${step.output ? `. ${labels.output}: ${outputText(step.output, lang, labels)}` : ''}`;
  const output = step.output;
  return (
    <div className="viz-grid viz-pipeline">
      {code ? <CodeView code={code} currentLine={null} label={labels.code} currentLabel={labels.lineN} maxLines={8} /> : null}
      <div className="viz-flow" role="group" aria-label={summaryText}>
        <ol className="viz-stage-track" aria-label={labels.stage}>
          {spec.stages.map((s, i) => (
            <li key={i} className={`viz-stage-dot${i === step.stage ? ' viz-stage-current' : i < step.stage ? ' viz-stage-done' : ''}`} aria-current={i === step.stage ? 'step' : undefined}><code>{s.op}</code></li>
          ))}
        </ol>
        <p className="viz-flow-label">{step.stage <= 0 ? spec.input.label[lang] : `${labels.output} · ${spec.stages[step.stage - 1].op}`}</p>
        <ul className="viz-items" aria-label={labels.input}>
          {step.items.map((item) => {
            const changed = prevStatus.size > 0 ? prevStatus.get(item.id) !== item.status : false;
            const role = compareRole(item.id);
            const focus = step.focus === item.id || role !== null;
            return (
              <li key={changed || focus ? `${item.id}-${tick}` : item.id} className={`viz-item viz-item-${item.status}${focus ? ' viz-item-focus' : ''}${changed ? ' viz-changed' : ''}`} data-status={item.status} data-compare={role ?? undefined}>
                {role ? <span className="viz-item-role">{role}</span> : null}
                <span className="viz-item-label">{labelText(item.label, lang)}</span>
                {STATUS_MARK[item.status] ? <span className="viz-item-mark" aria-hidden="true">{STATUS_MARK[item.status]}</span> : null}
                {item.status !== 'in' ? <span className="viz-sr"> — {statusLabel(item.status, labels)}</span> : null}
              </li>
            );
          })}
        </ul>
        {stage ? (
          <>
            <div className="viz-flow-arrow" aria-hidden="true"><span /><span>↓</span><span /></div>
            <div className="viz-predicate" data-op={stage.op}><span className="viz-predicate-op">.{stage.op}(</span><code>{stage.fn}</code><span className="viz-predicate-op">)</span></div>
            {compare ? (
              <p key={`cmp-${tick}`} className={`viz-compare${compare.order === 'error' ? ' viz-compare-error' : ''} viz-changed`} data-role="compare">
                <span className="viz-dim">{labels.comparison(compare.index, compare.count)}:</span>{' '}
                <code>a</code> = {labelText(itemById.get(compare.a)?.label, lang)}, <code>b</code> = {labelText(itemById.get(compare.b)?.label, lang)} → <strong>{compare.result}</strong>
                {compare.order !== 'error' ? <span className="viz-dim"> · {compareMeaning(compare, labels)}</span> : null}
              </p>
            ) : null}
            <div className="viz-flow-arrow" aria-hidden="true"><span /><span>↓</span><span /></div>
            {output && output.kind === 'list' ? (
              <ul className="viz-items viz-items-out" aria-label={labels.output}>
                {output.items.map((item) => <li key={prevOutIds.has(item.id) ? item.id : `${item.id}-${tick}`} className={`viz-item viz-item-out${prevOutIds.has(item.id) ? '' : ' viz-changed'}`}><span className="viz-item-label">{labelText(item.label, lang)}</span></li>)}
                {output.items.length === 0 ? <li className="viz-item viz-item-empty">[ ]</li> : null}
              </ul>
            ) : output && output.kind === 'value' ? (
              <div className="viz-items viz-items-out" aria-label={labels.output}>
                <span key={`${labelText(output.label, lang)}-${tick}`} className="viz-item viz-item-out viz-item-value viz-changed"><span className="viz-item-label">{labelText(output.label, lang)}</span></span>
                {output.initial !== undefined ? <span className="viz-dim viz-small">{labels.initial}: <code>{labelText(output.initial, lang)}</code></span> : null}
              </div>
            ) : output && output.kind === 'pending' ? (
              <div className="viz-items viz-items-out" aria-label={labels.output} data-output="pending">
                <span className="viz-item viz-item-pending" aria-hidden="true">…</span>
                <span className="viz-dim viz-small">{labels.pending}</span>
              </div>
            ) : output && output.kind === 'error' ? (
              <div className="viz-items viz-items-out" aria-label={labels.output} data-output="error">
                <span key={`err-${tick}`} className="viz-item viz-item-out viz-item-error-out viz-changed"><span aria-hidden="true">✖ </span><span className="viz-sr">{labels.threw}: </span><span className="viz-item-label">{output.name}: {output.message}</span></span>
              </div>
            ) : null}
            <p className="viz-flow-label">{step.stage === spec.stages.length - 1 && !step.focus && !compare && spec.resultLabel && output?.kind !== 'error' ? spec.resultLabel[lang] : `${labels.output} · ${stage.op}`}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
