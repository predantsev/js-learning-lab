import { svgStyle, type PlayerProps } from '../VisualPlayer';
import type { SequenceSpec } from '../types';


/** Greedy word wrap by character budget (SVG has no automatic wrapping). */
export function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && (line + ' ' + word).length > maxChars) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
    while (line.length > maxChars) { lines.push(line.slice(0, maxChars)); line = line.slice(maxChars); }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

const ACTOR_W = 150;
const ACTOR_H = 40;
const GAP = 40;
const LINE_H = 15;
const ROW_PAD = 14;

export function Sequence({ spec, index, tick, labels, lang }: PlayerProps<SequenceSpec>) {
  const step = spec.steps[index];
  const visibleCount = step.message + 1;
  const previousVisible = index > 0 ? spec.steps[index - 1].message + 1 : 0;
  const text = (loc: Record<string, string> | null) => (loc ? loc[lang] : '');
  const actorX = new Map(spec.actors.map((a, i) => [a.id, 20 + i * (ACTOR_W + GAP) + ACTOR_W / 2]));
  const width = 40 + spec.actors.length * ACTOR_W + (spec.actors.length - 1) * GAP;

  // Row layout: every message reserves its height so the picture never jumps while stepping.
  type Row = { y: number; h: number; lines: string[]; note: string[] };
  const rows: Row[] = [];
  let y = ACTOR_H + 30;
  for (const m of spec.messages) {
    const x1 = actorX.get(m.from) ?? 0;
    const x2 = actorX.get(m.to) ?? 0;
    const span = m.kind === 'note' ? ACTOR_W + GAP : Math.max(Math.abs(x2 - x1), ACTOR_W);
    const lines = wrap(text(m.label), Math.max(16, Math.floor(span / 6.4)));
    const note = m.note ? wrap(text(m.note), Math.max(18, Math.floor(span / 6.2))) : [];
    const h = lines.length * LINE_H + 14 + (note.length ? note.length * LINE_H + 12 : 0) + ROW_PAD;
    rows.push({ y, h, lines, note });
    y += h;
  }
  const height = y + 20;
  const summary = `${labels.actors}: ${spec.actors.map((a) => text(a.label)).join(', ')}. ${spec.messages.slice(0, visibleCount).map((m, i) => `${i + 1}. ${text(spec.actors.find((a) => a.id === m.from)?.label ?? null)} → ${text(spec.actors.find((a) => a.id === m.to)?.label ?? null)}: ${text(m.label)}`).join(' ')}`;
  return (
    <div className="viz-grid viz-sequence">
      <div className="viz-panel viz-svg-panel">
        <svg className="viz-svg" viewBox={`0 0 ${width} ${height}`} width={width} role="img" aria-label={summary} style={svgStyle(width)}>
          <defs>
            <marker id="viz-s-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" className="viz-marker" /></marker>
            <marker id="viz-s-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" className="viz-marker viz-marker-accent" /></marker>
            <marker id="viz-s-open-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10" className="viz-marker-open viz-marker-accent-stroke" /></marker>
            <marker id="viz-s-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10" className="viz-marker-open" /></marker>
          </defs>
          {spec.actors.map((a) => {
            const x = actorX.get(a.id) ?? 0;
            const lines = wrap(text(a.label), 20);
            return (
              <g key={a.id} className="viz-actor">
                <line x1={x} y1={ACTOR_H} x2={x} y2={height - 10} className="viz-lifeline" />
                <rect x={x - ACTOR_W / 2} y={0} width={ACTOR_W} height={ACTOR_H} rx="8" className="viz-node-shape" />
                {lines.slice(0, 2).map((l, i) => <text key={i} x={x} y={lines.length > 1 ? 17 + i * 14 : 24} textAnchor="middle" className="viz-node-label viz-svg-small">{l}</text>)}
              </g>
            );
          })}
          {spec.messages.map((m, i) => {
            if (i >= visibleCount) return null;
            const row = rows[i];
            const current = i === step.message;
            const fresh = i >= previousVisible;
            const x1 = actorX.get(m.from) ?? 0;
            const x2 = actorX.get(m.to) ?? 0;
            const arrowY = row.y + row.lines.length * LINE_H + 6;
            const mid = (x1 + x2) / 2;
            const marker = m.kind === 'async' ? (current ? 'url(#viz-s-open-accent)' : 'url(#viz-s-open)') : current ? 'url(#viz-s-arrow-accent)' : 'url(#viz-s-arrow)';
            return (
              <g key={fresh ? `${m.id}-${tick}` : m.id} className={`viz-message viz-message-${m.kind}${current ? ' viz-message-current' : ''}${fresh ? ' viz-changed' : ''}`}>
                {m.kind === 'note' ? (
                  <g>
                    <rect x={x1 - ACTOR_W / 2 + 8} y={row.y - 4} width={ACTOR_W + 16} height={row.lines.length * LINE_H + 12} rx="4" className="viz-note-shape" />
                    {row.lines.map((l, j) => <text key={j} x={x1 - ACTOR_W / 2 + 16} y={row.y + 10 + j * LINE_H} className="viz-svg-small">{l}</text>)}
                  </g>
                ) : (
                  <g>
                    {row.lines.map((l, j) => <text key={j} x={mid} y={row.y + 10 + j * LINE_H} textAnchor="middle" className={`viz-svg-small viz-message-label${current ? ' viz-message-label-current' : ''}`}>{l}</text>)}
                    <line x1={x1} y1={arrowY} x2={x2 + (x2 > x1 ? -2 : 2)} y2={arrowY} className={`viz-message-line${m.kind === 'return' ? ' viz-edge-dashed' : ''}`} markerEnd={marker} />
                    <circle cx={x1} cy={arrowY} r="3" className="viz-message-dot" />
                    <text x={Math.min(x1, x2) - 14} y={arrowY + 4} textAnchor="end" className="viz-svg-small viz-svg-dim">{i + 1}</text>
                  </g>
                )}
                {row.note.length > 0 ? (
                  <g className="viz-annotation">
                    <rect x={mid - Math.max(...row.note.map((l) => l.length)) * 3.2 - 8} y={arrowY + 8} width={Math.max(...row.note.map((l) => l.length)) * 6.4 + 16} height={row.note.length * LINE_H + 8} rx="4" className="viz-annotation-bg" />
                    {row.note.map((l, j) => <text key={j} x={mid} y={arrowY + 20 + j * LINE_H} textAnchor="middle" className="viz-svg-small viz-annotation-text">{l}</text>)}
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
      <details className="viz-text-alt">
        <summary>{labels.textVersion}</summary>
        <ol>
          {spec.messages.slice(0, visibleCount).map((m, i) => <li key={m.id} aria-current={i === step.message ? 'step' : undefined}>{text(spec.actors.find((a) => a.id === m.from)?.label ?? null)} → {text(spec.actors.find((a) => a.id === m.to)?.label ?? null)} ({m.kind}): {text(m.label)}{m.note ? ` — ${labels.note}: ${text(m.note)}` : ''}</li>)}
        </ol>
      </details>
    </div>
  );
}
