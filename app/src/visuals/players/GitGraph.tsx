import { svgStyle, type PlayerProps } from '../VisualPlayer';
import type { GitGraphSpec } from '../types';

const COL = 64;
const ROW = 46;
const PAD_X = 30;
const PAD_Y = 28;

export function GitGraph({ spec, index, tick, labels }: PlayerProps<GitGraphSpec>) {
  const step = spec.steps[index];
  const changed = new Set(step.changed);
  const commits = step.commits;
  const byId = new Map(commits.map((c) => [c.id, c]));
  const lanes = Math.max(1, ...commits.map((c) => c.lane + 1), ...step.branches.map((b) => b.lane + 1));
  const cols = Math.max(1, ...commits.map((c) => c.x + 1));
  const cx = (c: { x: number }) => PAD_X + c.x * COL;
  const cy = (c: { lane: number }) => PAD_Y + c.lane * ROW;
  const head = step.head;
  const headCommit = 'branch' in head ? step.branches.find((b) => b.name === head.branch)?.at ?? null : head.detached;
  // Branch labels stack per commit so several pointers on one commit stay readable.
  const labelsAt = new Map<string, string[]>();
  for (const b of step.branches) {
    if (!b.at) continue;
    if (!labelsAt.has(b.at)) labelsAt.set(b.at, []);
    labelsAt.get(b.at)!.push(b.name);
  }
  const width = PAD_X * 2 + cols * COL + 120;
  const height = PAD_Y * 2 + lanes * ROW + 10;
  const summary = `${labels.commits}: ${commits.map((c) => `${c.id}${c.parents.length ? ` (${labels.parents}: ${c.parents.join(', ')})` : ''}${c.orphaned ? ` (${labels.orphaned})` : ''}`).join('; ')}. ${labels.branches}: ${step.branches.map((b) => `${b.name} → ${b.at ?? '—'}${b.current ? ` (${labels.head})` : ''}`).join(', ')}.`;
  const wt = step.workingTree;
  return (
    <div className="viz-grid viz-git-graph">
      {step.command ? <p className="viz-command"><span className="viz-dim viz-small">{labels.command}</span> <code>$ {step.command}</code></p> : null}
      <div className="viz-panel viz-svg-panel">
        <svg className="viz-svg" viewBox={`0 0 ${width} ${height}`} width={width} role="img" aria-label={summary} style={svgStyle(width)}>
          {Array.from({ length: lanes }, (_, lane) => <line key={lane} x1={PAD_X - 16} y1={PAD_Y + lane * ROW} x2={width - 10} y2={PAD_Y + lane * ROW} className="viz-lane" />)}
          {commits.map((c) => c.parents.map((p) => {
            const parent = byId.get(p);
            if (!parent) return null;
            const x1 = cx(parent); const y1 = cy(parent); const x2 = cx(c); const y2 = cy(c);
            const d = y1 === y2 ? `M ${x1} ${y1} L ${x2} ${y2}` : `M ${x1} ${y1} C ${x1 + COL / 2} ${y1}, ${x2 - COL / 2} ${y2}, ${x2} ${y2}`;
            return <path key={`${p}-${c.id}`} d={d} className={`viz-git-edge${c.orphaned ? ' viz-git-orphaned' : ''}`} />;
          }))}
          {commits.map((c) => {
            const flash = changed.has(c.id);
            const isHead = headCommit === c.id;
            return (
              <g key={flash ? `${c.id}-${tick}` : c.id} className={`viz-commit${c.orphaned ? ' viz-git-orphaned' : ''}${isHead ? ' viz-commit-head' : ''}${flash ? ' viz-changed' : ''}`} transform={`translate(${cx(c)} ${cy(c)})`}>
                <circle r="11" className="viz-commit-dot" />
                <text y="4" textAnchor="middle" className="viz-svg-mono viz-commit-id">{c.id.replace(/′/g, "'")}</text>
                <title>{c.message}</title>
              </g>
            );
          })}
          {[...labelsAt.entries()].map(([id, names]) => {
            const c = byId.get(id);
            if (!c) return null;
            return names.map((name, i) => {
              const current = 'branch' in step.head && step.head.branch === name;
              const flash = changed.has(name);
              const w = name.length * 7 + 18 + (current ? 40 : 0);
              return (
                <g key={flash ? `${name}-${tick}` : name} className={`viz-branch${current ? ' viz-branch-current' : ''}${flash ? ' viz-changed' : ''}`} transform={`translate(${cx(c) + 16} ${cy(c) - 10 + i * 20})`}>
                  <rect width={w} height="18" rx="9" className="viz-branch-shape" />
                  <text x="9" y="13" className="viz-svg-small viz-branch-name">{current ? `HEAD → ${name}` : name}</text>
                </g>
              );
            });
          })}
          {'detached' in step.head && byId.get(step.head.detached) ? (
            <g className="viz-branch viz-branch-current" transform={`translate(${cx(byId.get(step.head.detached)!) + 16} ${cy(byId.get(step.head.detached)!) - 10})`}>
              <rect width="120" height="18" rx="9" className="viz-branch-shape" />
              <text x="9" y="13" className="viz-svg-small viz-branch-name">{labels.detached}</text>
            </g>
          ) : null}
          {commits.length === 0 ? <text x={PAD_X} y={PAD_Y + 5} className="viz-svg-small viz-svg-dim">{labels.empty} · {step.branches.map((b) => b.name).join(', ')}</text> : null}
        </svg>
      </div>
      <section className="viz-panel viz-worktree" aria-label={labels.workingTree}>
        <header className="viz-panel-head"><span>{labels.workingTree}</span>{step.merging ? <span className="viz-badge viz-badge-warn">{labels.merging(step.merging)}</span> : null}</header>
        <div className="viz-wt-grid">
          {([['modified', wt.modified, labels.modified], ['staged', wt.staged, labels.staged], ['conflicted', wt.conflicted, labels.conflicted]] as const).map(([key, files, title]) => (
            <div key={key} className={`viz-wt-col viz-wt-${key}`}>
              <h4 className="viz-scope-title">{title}</h4>
              <ul className="viz-wt-list" aria-label={title}>
                {files.map((f) => <li key={changed.has(f) ? `${f}-${tick}` : f} className={changed.has(f) ? 'viz-changed' : undefined}><code>{f}</code></li>)}
                {files.length === 0 ? <li className="viz-dim viz-small">{labels.empty}</li> : null}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <details className="viz-text-alt">
        <summary>{labels.textVersion}</summary>
        <ul>
          {commits.map((c) => <li key={c.id}><code>{c.id}</code> {c.message}{c.parents.length ? ` (${labels.parents}: ${c.parents.join(', ')})` : ''}{c.orphaned ? ` — ${labels.orphaned}` : ''}</li>)}
        </ul>
        <p>{labels.branches}: {step.branches.map((b) => `${b.name} → ${b.at ?? '—'}${b.current ? ` (${labels.head})` : ''}`).join(', ')}</p>
      </details>
    </div>
  );
}
