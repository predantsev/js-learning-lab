import type { PlayerProps } from '../VisualPlayer';
import type { PipelineItem, PipelineSpec } from '../types';
import type { VisualLabels } from '../labels';
import { CodeView } from '../CodeView';

const STATUS_MARK: Record<PipelineItem['status'], string> = { in: '', waiting: '', kept: '✓', dropped: '✕', mapped: '→', consumed: '+', moved: '↕', skipped: '·' };

function statusLabel(status: PipelineItem['status'], labels: VisualLabels): string {
  switch (status) {
    case 'kept': return labels.kept;
    case 'dropped': return labels.dropped;
    case 'waiting': return labels.waiting;
    case 'mapped': return labels.mapped;
    case 'consumed': return labels.consumed;
    case 'moved': return labels.moved;
    case 'skipped': return labels.skipped;
    default: return '';
  }
}

export function Pipeline({ spec, index, tick, labels, lang }: PlayerProps<PipelineSpec>) {
  const step = spec.steps[index];
  const previous = index > 0 ? spec.steps[index - 1] : null;
  const stage = step.stage >= 0 ? spec.stages[step.stage] : null;
  const code = spec.code ? spec.code.replace(/\n$/, '') : null;
  const prevStatus = new Map((previous && previous.stage === step.stage ? previous.items : []).map((i) => [i.id, i.status]));
  const prevOutIds = new Set(previous && previous.stage === step.stage && previous.output && previous.output.kind === 'list' ? previous.output.items.map((i) => i.id) : []);
  const summaryText = `${stage ? `${stage.op}(${stage.fn}): ` : `${labels.input}: `}${step.items.map((i) => `${i.label}${i.status !== 'in' && i.status !== 'waiting' ? ` (${statusLabel(i.status, labels)})` : ''}`).join(', ')}${step.output ? `. ${labels.output}: ${step.output.kind === 'list' ? step.output.items.map((i) => i.label).join(', ') : step.output.label}` : ''}`;
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
            const focus = step.focus === item.id;
            return (
              <li key={changed || focus ? `${item.id}-${tick}` : item.id} className={`viz-item viz-item-${item.status}${focus ? ' viz-item-focus' : ''}${changed ? ' viz-changed' : ''}`} data-status={item.status}>
                <span className="viz-item-label">{item.label}</span>
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
            <div className="viz-flow-arrow" aria-hidden="true"><span /><span>↓</span><span /></div>
            {step.output && step.output.kind === 'list' ? (
              <ul className="viz-items viz-items-out" aria-label={labels.output}>
                {step.output.items.map((item) => <li key={prevOutIds.has(item.id) ? item.id : `${item.id}-${tick}`} className={`viz-item viz-item-out${prevOutIds.has(item.id) ? '' : ' viz-changed'}`}><span className="viz-item-label">{item.label}</span></li>)}
                {step.output.items.length === 0 ? <li className="viz-item viz-item-empty">[ ]</li> : null}
              </ul>
            ) : step.output ? (
              <div className="viz-items viz-items-out" aria-label={labels.output}>
                <span key={`${step.output.label}-${tick}`} className="viz-item viz-item-out viz-item-value viz-changed"><span className="viz-item-label">{step.output.label}</span></span>
                {step.output.initial !== undefined ? <span className="viz-dim viz-small">{labels.initial}: <code>{step.output.initial}</code></span> : null}
              </div>
            ) : null}
            <p className="viz-flow-label">{step.stage === spec.stages.length - 1 && !step.focus && spec.resultLabel ? spec.resultLabel[lang] : `${labels.output} · ${stage.op}`}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
