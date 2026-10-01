import { useMemo } from 'react';
import { svgStyle, type PlayerProps } from '../VisualPlayer';
import type { Heap, HeapEntry, MemoryGraphSpec, TraceValue } from '../types';
import { VISUAL_LABELS, type VisualLabels } from '../labels';
import { CodeView } from '../CodeView';
import { heapSummary, valueText } from '../ValueView';

// Geometry (SVG user units ≈ px at 1:1; the svg scales down to the container width).
const ROW_H = 24;
const GAP = 84;
const PAD = 10;
const LOOP_BACK = 44; // room on the right for arrows from one heap box to another
const CHAR_W = 7.3; // 12 px monospace
const BIND_RANGE = { min: 104, max: 200 };
const HEAP_RANGE = { min: 132, max: 240 };

type HeapBox = { id: string; entry: HeapEntry; rows: { key: string; value: TraceValue }[]; x: number; y: number; w: number; h: number };

function rowsOf(entry: HeapEntry, heap: Heap, labels: VisualLabels): { key: string; value: TraceValue }[] {
  if (entry.t === 'object') return entry.props.map(([k, v]) => ({ key: k, value: v }));
  if (entry.t === 'array') return entry.items.map((v, i) => ({ key: String(i), value: v }));
  if (entry.t === 'set') return entry.items.map((v, i) => ({ key: String(i), value: v }));
  if (entry.t === 'map') return entry.entries.map(([k, v]) => ({ key: valueText(k, heap, labels), value: v }));
  return [];
}

const textWidth = (text: string) => Math.ceil(text.length * CHAR_W) + 16;
const clamp = (value: number, { min, max }: { min: number; max: number }) => Math.min(max, Math.max(min, value));

/**
 * Column widths follow the longest text of the whole visual (every step, both languages), so the
 * picture never changes size while stepping or switching language. Short names and values give a
 * picture of about 350–450 px; see content/VISUALS.md (width guidance).
 */
export function memoryGraphGeometry(spec: MemoryGraphSpec) {
  let bindText = 0;
  let heapText = 0;
  let loopBack = false;
  for (const labels of Object.values(VISUAL_LABELS)) {
    for (const step of spec.steps) {
      for (const b of step.bindings) bindText = Math.max(bindText, textWidth(b.value.t === 'ref' ? `${b.name} → #${String(b.value.id)}` : `${b.name} = ${valueText(b.value, step.heap, labels)}`));
      for (const [id, entry] of Object.entries(step.heap)) {
        heapText = Math.max(heapText, textWidth(`#${id} ${heapSummary(entry, id)}`));
        if ((entry.t === 'function' || entry.t === 'class') && entry.scope) heapText = Math.max(heapText, textWidth(labels.closureOf(entry.scopeName ?? String(entry.scope))));
        for (const row of rowsOf(entry, step.heap, labels)) {
          heapText = Math.max(heapText, textWidth(`${row.key}: ${row.value.t === 'ref' ? `→ #${String(row.value.id)}` : valueText(row.value, step.heap, labels)}`));
          if (row.value.t === 'ref') loopBack = true;
        }
      }
    }
  }
  const bindW = clamp(bindText, BIND_RANGE);
  const heapW = clamp(heapText, HEAP_RANGE);
  return { bindW, heapW, width: PAD + bindW + GAP + heapW + (loopBack ? LOOP_BACK : PAD) };
}

export function MemoryGraph({ spec, index, tick, labels }: PlayerProps<MemoryGraphSpec>) {
  const step = spec.steps[index];
  const heap = step.heap;
  const changed = new Set(step.changed);
  const bindings = step.bindings;
  const heapIds = Object.keys(heap);
  const { bindW, heapW, width } = useMemo(() => memoryGraphGeometry(spec), [spec]);

  // Layout: bindings in one column on the left; heap entries stacked in a column on the right.
  const bindH = Math.max(1, bindings.length) * ROW_H + ROW_H;
  const boxes: HeapBox[] = [];
  let y = PAD;
  for (const id of heapIds) {
    const entry = heap[id];
    const rows = rowsOf(entry, heap, labels);
    const h = ROW_H + Math.max(rows.length, entry.t === 'function' || entry.t === 'class' ? 1 : rows.length === 0 ? 1 : 0) * ROW_H + 6;
    boxes.push({ id, entry, rows, x: PAD + bindW + GAP, y, w: heapW, h });
    y += h + 14;
  }
  const height = Math.max(bindH + 2 * PAD, y) + PAD;
  const boxById = new Map(boxes.map((b) => [b.id, b]));

  // Arrows: from a binding row (right edge) or a heap row (right edge, looping back) to a heap box (left edge).
  const arrows: { key: string; x1: number; y1: number; x2: number; y2: number; flash: boolean; curve: boolean }[] = [];
  bindings.forEach((b, i) => {
    if (b.value.t !== 'ref') return;
    const target = boxById.get(String(b.value.id));
    if (!target) return;
    arrows.push({ key: `b-${b.name}`, x1: PAD + bindW, y1: PAD + ROW_H + i * ROW_H + ROW_H / 2, x2: target.x, y2: target.y + ROW_H / 2, flash: changed.has(b.name), curve: false });
  });
  for (const box of boxes) {
    box.rows.forEach((row, i) => {
      if (row.value.t !== 'ref') return;
      const target = boxById.get(String(row.value.id));
      if (!target) return;
      arrows.push({ key: `h-${box.id}-${row.key}`, x1: box.x + box.w, y1: box.y + ROW_H + i * ROW_H + ROW_H / 2 + 3, x2: target.x + target.w, y2: target.y + ROW_H / 2, flash: changed.has(box.id), curve: true });
    });
  }
  const summary = `${bindings.map((b) => `${b.name} = ${valueText(b.value, heap, labels)}`).join('; ')}. ${heapIds.map((id) => `#${id} ${heapSummary(heap[id], id)}`).join('; ')}`;

  return (
    <div className="viz-grid viz-memory-graph">
      {spec.code ? <CodeView code={spec.code} currentLine={step.line} label={labels.code} currentLabel={labels.lineN} flashKey={tick} maxLines={10} /> : null}
      <div className="viz-panel viz-svg-panel">
        <svg className="viz-svg" viewBox={`0 0 ${width} ${height}`} width={width} role="img" aria-label={summary} style={svgStyle(width)}>
          <defs>
            <marker id="viz-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" className="viz-marker" /></marker>
            <marker id="viz-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" className="viz-marker viz-marker-accent" /></marker>
          </defs>
          <g className="viz-bindings">
            <text x={PAD} y={PAD + 15} className="viz-svg-label">{labels.variables}</text>
            {bindings.map((b, i) => {
              const flash = changed.has(b.name);
              const yy = PAD + ROW_H + i * ROW_H;
              return (
                <g key={flash ? `${b.name}-${tick}` : b.name} className={`viz-binding${flash ? ' viz-changed' : ''}`} transform={`translate(${PAD} ${yy})`}>
                  <rect width={bindW} height={ROW_H - 2} rx="4" className="viz-svg-box" />
                  <text x="8" y="16" className="viz-svg-mono"><tspan className="viz-svg-name">{b.name}</tspan>{b.value.t === 'ref' ? <tspan className="viz-svg-dim"> → #{String(b.value.id)}</tspan> : <tspan> = {valueText(b.value, heap, labels)}</tspan>}</text>
                </g>
              );
            })}
          </g>
          <g className="viz-heap-boxes">
            {boxes.length > 0 ? <text x={boxes[0].x} y={PAD - 2} className="viz-svg-label" /> : null}
            {boxes.map((box) => {
              const flash = changed.has(box.id);
              return (
                <g key={flash ? `${box.id}-${tick}` : box.id} className={`viz-heap-box${flash ? ' viz-changed' : ''}`} transform={`translate(${box.x} ${box.y})`}>
                  <rect width={box.w} height={box.h} rx="6" className="viz-svg-box viz-svg-heap" />
                  <text x="8" y="16" className="viz-svg-mono"><tspan className="viz-svg-id">#{box.id}</tspan> <tspan className="viz-svg-name">{heapSummary(box.entry, box.id)}</tspan></text>
                  <line x1="0" y1={ROW_H - 2} x2={box.w} y2={ROW_H - 2} className="viz-svg-line" />
                  {box.rows.map((row, i) => (
                    <text key={row.key} x="8" y={ROW_H + 16 + i * ROW_H} className="viz-svg-mono viz-svg-small"><tspan className="viz-svg-key">{row.key}</tspan>: {row.value.t === 'ref' ? <tspan className="viz-svg-dim">→ #{String(row.value.id)}</tspan> : <tspan>{valueText(row.value, heap, labels)}</tspan>}</text>
                  ))}
                  {box.entry.t === 'function' || box.entry.t === 'class' ? <text x="8" y={ROW_H + 16} className="viz-svg-mono viz-svg-small viz-svg-dim">{box.entry.scope ? labels.closureOf(box.entry.scopeName ?? String(box.entry.scope)) : 'ƒ'}</text> : null}
                  {box.rows.length === 0 && box.entry.t !== 'function' && box.entry.t !== 'class' ? <text x="8" y={ROW_H + 16} className="viz-svg-mono viz-svg-small viz-svg-dim">{'{ }'}</text> : null}
                </g>
              );
            })}
          </g>
          <g className="viz-arrows">
            {arrows.map((a) => {
              const d = a.curve
                ? `M ${a.x1} ${a.y1} C ${a.x1 + 36} ${a.y1}, ${a.x2 + 36} ${a.y2}, ${a.x2} ${a.y2}`
                : `M ${a.x1} ${a.y1} C ${a.x1 + GAP / 2} ${a.y1}, ${a.x2 - GAP / 2} ${a.y2}, ${a.x2} ${a.y2}`;
              return <path key={a.flash ? `${a.key}-${tick}` : a.key} d={d} className={`viz-arrow${a.flash ? ' viz-arrow-accent viz-changed' : ''}`} markerEnd={a.flash ? 'url(#viz-arrow-accent)' : 'url(#viz-arrow)'} />;
            })}
          </g>
        </svg>
      </div>
      <details className="viz-text-alt">
        <summary>{labels.textVersion}</summary>
        <table className="viz-table"><caption className="viz-sr">{labels.variables}</caption><tbody>
          {bindings.map((b) => <tr key={b.name}><th scope="row"><code>{b.name}</code></th><td>{valueText(b.value, heap, labels)}{changed.has(b.name) ? ` (${labels.changed})` : ''}</td></tr>)}
        </tbody></table>
        <ul>
          {heapIds.map((id) => <li key={id}><code>#{id}</code> {heapSummary(heap[id], id)}: {rowsOf(heap[id], heap, labels).map((r) => `${r.key} = ${valueText(r.value, heap, labels)}`).join(', ') || '—'}{changed.has(id) ? ` (${labels.changed})` : ''}</li>)}
        </ul>
      </details>
    </div>
  );
}
