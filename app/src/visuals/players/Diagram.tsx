import { edgeLabelBox, edgeLine, edgeNoteBox, insideWidth, nodeNoteBox } from '@shared/visuals/kinds/diagram-geometry.js';
import { svgStyle, type PlayerProps } from '../VisualPlayer';
import type { DiagramNode, DiagramSpec } from '../types';

// Positions of edges, labels and annotations come from shared/visuals/kinds/diagram-geometry.js, which
// the compiler also uses to size the picture so that none of them is clipped.

function Shape({ node }: { node: DiagramNode }) {
  const { x, y, w, h, shape } = node;
  if (shape === 'cylinder') {
    const ry = 6;
    return (
      <g>
        <path d={`M ${x} ${y + ry} v ${h - 2 * ry} a ${w / 2} ${ry} 0 0 0 ${w} 0 v ${-(h - 2 * ry)}`} className="viz-node-shape" />
        <ellipse cx={x + w / 2} cy={y + ry} rx={w / 2} ry={ry} className="viz-node-shape" />
      </g>
    );
  }
  if (shape === 'note') return <path d={`M ${x} ${y} h ${w - 10} l 10 10 v ${h - 10} h ${-w} z`} className="viz-node-shape" />;
  const rx = shape === 'pill' ? h / 2 : shape === 'round' ? 12 : 4;
  return <rect x={x} y={y} width={w} height={h} rx={rx} className="viz-node-shape" />;
}

export function Diagram({ spec, index, tick, labels, lang }: PlayerProps<DiagramSpec>) {
  const step = spec.steps[index];
  const previous = index > 0 ? spec.steps[index - 1] : null;
  const highlight = new Set(step.highlight);
  const dim = new Set(step.dim);
  const hidden = new Set(step.hidden);
  const prevHighlight = new Set(previous ? previous.highlight : []);
  const prevHidden = new Set(previous ? previous.hidden : spec.nodes.map((n) => n.id).concat(spec.edges.map((e) => e.id)));
  const nodeById = new Map(spec.nodes.map((n) => [n.id, n]));
  const annotations = new Map(step.annotate.map((a) => [a.id, a.text[lang]]));
  const text = (loc: Record<string, string> | null) => (loc ? loc[lang] : '');
  const state = (id: string) => (hidden.has(id) ? 'hidden' : highlight.has(id) ? 'highlight' : dim.has(id) ? 'dim' : 'normal');
  const flashes = (id: string) => (highlight.has(id) && !prevHighlight.has(id)) || (!hidden.has(id) && prevHidden.has(id));
  const summary = `${labels.nodes}: ${spec.nodes.filter((n) => !hidden.has(n.id)).map((n) => `${text(n.label)}${highlight.has(n.id) ? ` (${labels.highlighted})` : ''}`).join(', ')}. ${labels.edges}: ${spec.edges.filter((e) => !hidden.has(e.id)).map((e) => `${text(nodeById.get(e.from)?.label ?? null)} → ${text(nodeById.get(e.to)?.label ?? null)}${e.label ? ` (${text(e.label)})` : ''}`).join('; ')}.`;
  const { width, height } = spec.layout;
  return (
    <div className="viz-grid viz-diagram">
      <div className="viz-panel viz-svg-panel">
        <svg className="viz-svg" viewBox={`0 0 ${width} ${height}`} width={width} role="img" aria-label={summary} style={svgStyle(width)}>
          <defs>
            <marker id="viz-d-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" className="viz-marker" /></marker>
            <marker id="viz-d-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" className="viz-marker viz-marker-accent" /></marker>
          </defs>
          {spec.groups.filter((g) => g.w > 0).map((g) => (
            <g key={g.id} className={`viz-group viz-state-${state(g.id)}`}>
              <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="10" className="viz-group-shape" />
              <text x={g.x + 12} y={g.y + 18} className="viz-svg-label">{text(g.label)}</text>
            </g>
          ))}
          {spec.edges.filter((e) => !hidden.has(e.id)).map((e) => {
            const a = nodeById.get(e.from);
            const b = nodeById.get(e.to);
            if (!a || !b) return null;
            const line = edgeLine(a, b);
            const { x1, y1, x2, y2, vertical } = line;
            const st = state(e.id);
            const marker = st === 'highlight' ? 'url(#viz-d-arrow-accent)' : 'url(#viz-d-arrow)';
            const label = text(e.label);
            const note = annotations.get(e.id);
            const flash = flashes(e.id);
            return (
              <g key={flash ? `${e.id}-${tick}` : e.id} className={`viz-edge viz-state-${st}${flash ? ' viz-changed' : ''}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className={`viz-edge-line${e.kind === 'dashed' ? ' viz-edge-dashed' : ''}`} markerEnd={e.kind === 'line' ? undefined : marker} markerStart={e.kind === 'both' ? marker : undefined} />
                {label ? (() => {
                  const box = insideWidth(edgeLabelBox(line, label), width);
                  return (
                    <g>
                      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="4" className="viz-edge-label-bg" />
                      {vertical
                        ? <text x={box.x + 5} y={box.y + 12} className="viz-svg-small viz-edge-label">{label}</text>
                        : <text x={box.x + box.w / 2} y={box.y + 12} textAnchor="middle" className="viz-svg-small viz-edge-label">{label}</text>}
                    </g>
                  );
                })() : null}
                {note ? (() => {
                  const box = insideWidth(edgeNoteBox(line, note), width);
                  return (
                    <g className="viz-annotation">
                      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="4" className="viz-annotation-bg" />
                      {vertical
                        ? <text x={box.x + 6} y={box.y + 13} className="viz-svg-small viz-annotation-text">{note}</text>
                        : <text x={box.x + box.w / 2} y={box.y + 13} textAnchor="middle" className="viz-svg-small viz-annotation-text">{note}</text>}
                    </g>
                  );
                })() : null}
              </g>
            );
          })}
          {spec.nodes.filter((n) => !hidden.has(n.id)).map((n) => {
            const st = state(n.id);
            const note = annotations.get(n.id);
            const flash = flashes(n.id);
            return (
              <g key={flash ? `${n.id}-${tick}` : n.id} className={`viz-node viz-node-${n.shape} viz-state-${st}${flash ? ' viz-changed' : ''}`}>
                <Shape node={n} />
                <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 5} textAnchor="middle" className="viz-node-label">{text(n.label)}</text>
                {st === 'highlight' ? <text x={n.x + 6} y={n.y + 13} className="viz-svg-small viz-node-mark" aria-hidden="true">●</text> : null}
                {note ? (() => {
                  const box = insideWidth(nodeNoteBox(n, note), width);
                  return (
                    <g className="viz-annotation">
                      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="4" className="viz-annotation-bg" />
                      <text x={box.x + box.w / 2} y={box.y + 13} textAnchor="middle" className="viz-svg-small viz-annotation-text">{note}</text>
                    </g>
                  );
                })() : null}
              </g>
            );
          })}
        </svg>
      </div>
      <details className="viz-text-alt">
        <summary>{labels.textVersion}</summary>
        <ul>
          {spec.nodes.filter((n) => !hidden.has(n.id)).map((n) => <li key={n.id}>{text(n.label)}{n.group ? ` (${text(spec.groups.find((g) => g.id === n.group)?.label ?? null)})` : ''}{highlight.has(n.id) ? ` — ${labels.highlighted}` : dim.has(n.id) ? ` — ${labels.dimmed}` : ''}{annotations.has(n.id) ? `: ${annotations.get(n.id)}` : ''}</li>)}
        </ul>
        <ul>
          {spec.edges.filter((e) => !hidden.has(e.id)).map((e) => <li key={e.id}>{text(nodeById.get(e.from)?.label ?? null)} → {text(nodeById.get(e.to)?.label ?? null)}{e.label ? ` (${text(e.label)})` : ''}{highlight.has(e.id) ? ` — ${labels.highlighted}` : ''}{annotations.has(e.id) ? `: ${annotations.get(e.id)}` : ''}</li>)}
        </ul>
      </details>
    </div>
  );
}
