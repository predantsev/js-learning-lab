// The one step-through player: shared controls, caption (aria-live) and keyboard handling around
// a per-kind renderer. Styling only through app/src/styles/tokens.css via visuals.css (.viz-*).
import { useId, type ReactNode } from 'react';
import { useStepEngine, usePrefersReducedMotion, type StepEngine } from './engine';
import type { VisualLabels } from './labels';
import type { Lang, VisualKind, VisualSpec } from './types';
import { CodeTrace } from './players/CodeTrace';
import { MemoryGraph } from './players/MemoryGraph';
import { Pipeline } from './players/Pipeline';
import { EventLoop } from './players/EventLoop';
import { Diagram } from './players/Diagram';
import { Sequence } from './players/Sequence';
import { GitGraph } from './players/GitGraph';
import { RenderTimeline } from './players/RenderTimeline';

export type PlayerProps<S extends VisualSpec = VisualSpec> = { spec: S; index: number; tick: number; lang: Lang; labels: VisualLabels; reducedMotion: boolean };

/** SVG pictures scale down with the column, but never below 85 % of their natural size: beyond that the panel scrolls so text stays readable. */
export const svgStyle = (width: number) => ({ maxWidth: '100%', height: 'auto', minWidth: Math.round(width * 0.85) });

export type VisualPlayerProps = {
  visual: VisualKind;
  spec: VisualSpec;
  lang: Lang;
  labels: VisualLabels;
  reducedMotion?: boolean;
  onStep?: (index: number) => void;
  initialStep?: number;
  /** Accessible name of the whole player (defaults to labels.stepThrough). */
  title?: string;
};

const PLAYERS: Record<VisualKind, (props: PlayerProps<never>) => ReactNode> = {
  'code-trace': CodeTrace as (props: PlayerProps<never>) => ReactNode,
  'memory-graph': MemoryGraph as (props: PlayerProps<never>) => ReactNode,
  pipeline: Pipeline as (props: PlayerProps<never>) => ReactNode,
  'event-loop': EventLoop as (props: PlayerProps<never>) => ReactNode,
  diagram: Diagram as (props: PlayerProps<never>) => ReactNode,
  sequence: Sequence as (props: PlayerProps<never>) => ReactNode,
  'git-graph': GitGraph as (props: PlayerProps<never>) => ReactNode,
  'render-timeline': RenderTimeline as (props: PlayerProps<never>) => ReactNode,
};

export function captionFor(spec: VisualSpec, index: number, lang: Lang, labels: VisualLabels): { html: string | null; fallback: string } {
  const step = spec.steps[index] as { caption: Record<Lang, string> | null; trace?: { line: number }; line?: number | null } | undefined;
  if (!step) return { html: null, fallback: '' };
  if (step.caption && step.caption[lang]) return { html: step.caption[lang], fallback: '' };
  const line = step.trace?.line ?? step.line ?? null;
  return { html: null, fallback: line ? labels.lineN(line) : labels.stepOf(index + 1, spec.steps.length) };
}

export function Controls({ engine, labels }: { engine: StepEngine; labels: VisualLabels }) {
  const last = engine.index >= engine.total - 1;
  return (
    <div className="viz-controls" role="group" aria-label={labels.stepThrough}>
      <button type="button" className="viz-btn" onClick={engine.prev} disabled={engine.index <= 0} data-action="prev">{labels.previous}</button>
      <button type="button" className="viz-btn viz-btn-primary" onClick={engine.next} disabled={last} data-action="next">{labels.next}</button>
      <output className="viz-counter" aria-live="off" data-role="counter">{labels.stepOf(engine.index + 1, engine.total)}</output>
      <span className="viz-controls-spacer" />
      <button type="button" className="viz-btn" onClick={engine.togglePlay} aria-pressed={engine.playing} data-action="play">{engine.playing ? labels.pause : labels.play}</button>
      <button type="button" className="viz-btn" onClick={engine.reset} disabled={engine.index === 0 && !engine.playing} data-action="reset">{labels.reset}</button>
    </div>
  );
}

export function VisualPlayer({ visual, spec, lang, labels, reducedMotion, onStep, initialStep = 0, title }: VisualPlayerProps) {
  const total = spec.steps.length;
  const engine = useStepEngine({ total, initialStep, onStep });
  const osReduced = usePrefersReducedMotion();
  const reduced = reducedMotion === true || osReduced;
  const id = useId();
  const Player = PLAYERS[visual];
  const caption = captionFor(spec, engine.index, lang, labels);
  return (
    <div className="viz" data-kind={visual} data-reduced={reduced ? 'true' : 'false'} data-step={engine.index} role="region" aria-label={title ?? labels.stepThrough} aria-describedby={`${id}-caption`} tabIndex={0} onKeyDown={engine.onKeyDown}>
      <div className="viz-stage">
        {Player ? <Player spec={spec as never} index={engine.index} tick={engine.tick} lang={lang} labels={labels} reducedMotion={reduced} /> : null}
      </div>
      <div className="viz-caption" id={`${id}-caption`} aria-live="polite" aria-atomic="true" data-role="caption">
        <span className="viz-caption-step">{engine.index + 1}.</span>{' '}
        {caption.html ? <span dangerouslySetInnerHTML={{ __html: caption.html }} /> : <span>{caption.fallback}</span>}
      </div>
      <Controls engine={engine} labels={labels} />
    </div>
  );
}
