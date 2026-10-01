// diagram: generic boxes (optionally grouped) with labeled edges; each step highlights, dims,
// reveals or annotates. Layout is computed here so the player only draws.
import { IssueList, checkArray, checkEnum, checkId, checkLabel, checkText, isPlainObject, nonEmpty, renderText, toText } from '../common.js';

export const SHAPES = ['box', 'round', 'pill', 'cylinder', 'note'];
export const EDGE_KINDS = ['arrow', 'both', 'line', 'dashed'];

export const schema = {
  kind: 'diagram',
  summary: 'Nodes (boxes) with optional groups/lanes and labeled edges; per-step highlight, dim, reveal and annotate. For architecture and boundaries, state machines, prototype chains, component trees, ownership.',
  fields: {
    layout: '"lr" (default: groups become columns left→right) | "tb" (groups become rows top→bottom) | "grid" (every node sets col and row)',
    groups: '[{ id, label: { uk, en } | string }] — optional; drawn as a frame around their nodes',
    nodes: '[{ id, label: { uk, en } | string, group?: groupId, shape?: box|round|pill|cylinder|note, col?: n, row?: n, w?: px }]',
    edges: '[{ id?, from: nodeId, to: nodeId, label?: { uk, en } | string, kind?: arrow|both|line|dashed }]',
    steps: '[{ caption: { uk, en }, highlight?: [node or edge ids], dim?: [ids], show?: [ids] (ids listed in "hidden" appear from this step on), annotate?: [{ id, text: { uk, en } | string }] }]',
    hidden: '[ids] — nodes/edges hidden until a step lists them in "show"',
  },
};

export function validate(spec, issues = new IssueList()) {
  if (!isPlainObject(spec)) { issues.add('spec', 'must be a mapping'); return issues; }
  checkEnum(issues, spec.layout, 'spec.layout', ['lr', 'tb', 'grid'], { optional: true });
  const groupIds = new Set();
  if (spec.groups !== undefined && checkArray(issues, spec.groups, 'spec.groups')) {
    spec.groups.forEach((g, i) => {
      const p = `spec.groups[${i}]`;
      if (!isPlainObject(g)) { issues.add(p, 'must be { id, label }'); return; }
      if (checkId(issues, g.id, `${p}.id`)) { if (groupIds.has(g.id)) issues.add(`${p}.id`, `duplicate group id "${g.id}"`); groupIds.add(g.id); }
      checkLabel(issues, g.label, `${p}.label`);
    });
  }
  const nodeIds = new Set();
  if (checkArray(issues, spec.nodes, 'spec.nodes', { min: 1 })) {
    spec.nodes.forEach((n, i) => {
      const p = `spec.nodes[${i}]`;
      if (!isPlainObject(n)) { issues.add(p, 'must be { id, label }'); return; }
      if (checkId(issues, n.id, `${p}.id`)) { if (nodeIds.has(n.id) || groupIds.has(n.id)) issues.add(`${p}.id`, `duplicate id "${n.id}"`); nodeIds.add(n.id); }
      checkLabel(issues, n.label, `${p}.label`);
      if (n.group !== undefined && !groupIds.has(n.group)) issues.add(`${p}.group`, `unknown group "${n.group}"`);
      checkEnum(issues, n.shape, `${p}.shape`, SHAPES, { optional: true });
      if (spec.layout === 'grid' && !(Number.isInteger(n.col) && Number.isInteger(n.row))) issues.add(p, 'grid layout: every node needs integer "col" and "row"');
      if (n.w !== undefined && !(Number.isFinite(n.w) && n.w >= 40)) issues.add(`${p}.w`, 'must be a width in px (≥ 40)');
    });
  }
  const edgeIds = new Set();
  const allIds = () => new Set([...nodeIds, ...edgeIds, ...groupIds]);
  if (spec.edges !== undefined && checkArray(issues, spec.edges, 'spec.edges')) {
    spec.edges.forEach((e, i) => {
      const p = `spec.edges[${i}]`;
      if (!isPlainObject(e)) { issues.add(p, 'must be { from, to }'); return; }
      if (!nodeIds.has(e.from)) issues.add(`${p}.from`, `unknown node "${e.from}"`);
      if (!nodeIds.has(e.to)) issues.add(`${p}.to`, `unknown node "${e.to}"`);
      const id = e.id ?? `${e.from}->${e.to}`;
      if (edgeIds.has(id) || nodeIds.has(id)) issues.add(`${p}.id`, `duplicate edge id "${id}" (give parallel edges explicit ids)`);
      edgeIds.add(id);
      if (e.label !== undefined) checkLabel(issues, e.label, `${p}.label`);
      checkEnum(issues, e.kind, `${p}.kind`, EDGE_KINDS, { optional: true });
    });
  }
  const hidden = new Set(Array.isArray(spec.hidden) ? spec.hidden : []);
  if (spec.hidden !== undefined && !Array.isArray(spec.hidden)) issues.add('spec.hidden', 'must be a list of ids');
  for (const id of hidden) if (!allIds().has(id)) issues.add('spec.hidden', `unknown id "${id}"`);
  if (checkArray(issues, spec.steps, 'spec.steps', { min: 1 })) {
    const shown = new Set();
    spec.steps.forEach((s, i) => {
      const p = `spec.steps[${i}]`;
      if (!isPlainObject(s)) { issues.add(p, 'must be a mapping'); return; }
      checkText(issues, s.caption, `${p}.caption`);
      for (const key of ['highlight', 'dim', 'show']) {
        if (s[key] === undefined) continue;
        if (!Array.isArray(s[key])) { issues.add(`${p}.${key}`, 'must be a list of ids'); continue; }
        for (const id of s[key]) if (!allIds().has(id)) issues.add(`${p}.${key}`, `unknown id "${id}"`);
        if (key === 'show') for (const id of s.show) { if (!hidden.has(id)) issues.add(`${p}.show`, `"${id}" is not in spec.hidden, it is always visible`); shown.add(id); }
      }
      if (s.annotate !== undefined) {
        if (!Array.isArray(s.annotate)) issues.add(`${p}.annotate`, 'must be a list of { id, text }');
        else s.annotate.forEach((a, j) => {
          if (!isPlainObject(a) || !allIds().has(a.id)) issues.add(`${p}.annotate[${j}]`, 'needs an existing node/edge id');
          else checkLabel(issues, a.text, `${p}.annotate[${j}].text`);
        });
      }
    });
    for (const id of hidden) if (!shown.has(id)) issues.add('spec.hidden', `"${id}" is hidden but no step shows it`);
  }
  return issues;
}

// ---------- layout ----------
const NODE_H = 46;
const GAP_X = 96;
const GAP_Y = 22;
const GROUP_PAD = 16;
const GROUP_HEAD = 26;
const labelWidth = (label) => {
  const text = toText(label);
  const longest = Math.max(...Object.values(text).map((s) => String(s).length), 4);
  return Math.min(240, Math.max(96, Math.round(longest * 8.2 + 32)));
};

function layering(nodes, edges) {
  // Longest-path layering from sources (ignoring back edges found by DFS).
  const ids = nodes.map((n) => n.id);
  const out = new Map(ids.map((id) => [id, []]));
  for (const e of edges) if (out.has(e.from) && out.has(e.to) && e.from !== e.to) out.get(e.from).push(e.to);
  const state = new Map();
  const back = new Set();
  const dfs = (id) => {
    state.set(id, 1);
    for (const to of out.get(id)) {
      if (state.get(to) === 1) back.add(`${id}->${to}`);
      else if (!state.has(to)) dfs(to);
    }
    state.set(id, 2);
  };
  for (const id of ids) if (!state.has(id)) dfs(id);
  const layer = new Map(ids.map((id) => [id, 0]));
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 100) {
    changed = false;
    for (const e of edges) {
      if (back.has(`${e.from}->${e.to}`) || !layer.has(e.from) || !layer.has(e.to) || e.from === e.to) continue;
      if (layer.get(e.to) < layer.get(e.from) + 1) { layer.set(e.to, layer.get(e.from) + 1); changed = true; }
    }
  }
  return layer;
}

export function layout(spec) {
  const mode = spec.layout ?? 'lr';
  const groups = (spec.groups ?? []).map((g) => ({ id: g.id, label: toText(g.label) }));
  const edges = (spec.edges ?? []).map((e) => ({ id: e.id ?? `${e.from}->${e.to}`, from: e.from, to: e.to, label: e.label !== undefined ? toText(e.label) : null, kind: e.kind ?? 'arrow' }));
  const nodes = spec.nodes.map((n) => ({ id: n.id, label: toText(n.label), group: n.group ?? null, shape: n.shape ?? 'box', w: n.w ?? labelWidth(n.label), h: NODE_H, col: n.col, row: n.row }));
  // Column/row assignment.
  if (mode !== 'grid') {
    const groupIndex = new Map(groups.map((g, i) => [g.id, i]));
    const layers = layering(nodes, edges);
    const grouped = nodes.filter((n) => n.group !== null);
    const loose = nodes.filter((n) => n.group === null);
    // Ungrouped nodes are placed by layer; grouped nodes by group order, offset after the loose layers that precede them.
    const looseLayers = loose.length > 0 ? Math.max(...loose.map((n) => layers.get(n.id))) + 1 : 0;
    for (const n of loose) n.col = layers.get(n.id);
    for (const n of grouped) n.col = looseLayers + groupIndex.get(n.group);
    if (groups.length > 0 && loose.length > 0) {
      // Keep loose nodes that come *after* every grouped node (sinks) on the right.
      const maxGroupCol = looseLayers + groups.length - 1;
      for (const n of loose) if (edges.some((e) => e.to === n.id && grouped.some((g) => g.id === e.from)) && !edges.some((e) => e.from === n.id && grouped.some((g) => g.id === e.to))) n.col = maxGroupCol + 1;
    }
    const perCol = new Map();
    for (const n of nodes) { if (!perCol.has(n.col)) perCol.set(n.col, []); perCol.get(n.col).push(n); }
    for (const list of perCol.values()) list.forEach((n, i) => { n.row = i; });
    if (mode === 'tb') for (const n of nodes) { const c = n.col; n.col = n.row; n.row = c; }
  }
  // Coordinates: columns sized by the widest node in them.
  const cols = [...new Set(nodes.map((n) => n.col))].sort((a, b) => a - b);
  const colWidth = new Map(cols.map((c) => [c, Math.max(...nodes.filter((n) => n.col === c).map((n) => n.w))]));
  const colX = new Map();
  let x = GROUP_PAD;
  for (const c of cols) { colX.set(c, x); x += colWidth.get(c) + GAP_X; }
  const rows = [...new Set(nodes.map((n) => n.row))].sort((a, b) => a - b);
  const rowY = new Map();
  let y = GROUP_PAD + (groups.length > 0 ? GROUP_HEAD : 0);
  for (const r of rows) { rowY.set(r, y); y += NODE_H + GAP_Y; }
  for (const n of nodes) {
    n.x = colX.get(n.col) + (colWidth.get(n.col) - n.w) / 2;
    n.y = rowY.get(n.row);
  }
  const groupBoxes = groups.map((g) => {
    const members = nodes.filter((n) => n.group === g.id);
    if (members.length === 0) return { ...g, x: 0, y: 0, w: 0, h: 0 };
    let x0 = Math.min(...members.map((n) => n.x)) - GROUP_PAD;
    const y0 = Math.min(...members.map((n) => n.y)) - GROUP_PAD - GROUP_HEAD;
    let x1 = Math.max(...members.map((n) => n.x + n.w)) + GROUP_PAD;
    const y1 = Math.max(...members.map((n) => n.y + n.h)) + GROUP_PAD;
    // The group heading must fit inside the frame.
    const need = labelWidth(g.label) + 8;
    if (x1 - x0 < need) { const extra = (need - (x1 - x0)) / 2; x0 -= extra; x1 += extra; }
    return { ...g, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  });
  // Shift everything so the left/top-most box keeps a margin inside the viewBox.
  const minX = Math.min(...nodes.map((n) => n.x), ...groupBoxes.filter((g) => g.w > 0).map((g) => g.x));
  const minY = Math.min(...nodes.map((n) => n.y), ...groupBoxes.filter((g) => g.w > 0).map((g) => g.y));
  const MARGIN = 10;
  for (const n of nodes) { n.x = Math.round(n.x - minX + MARGIN); n.y = Math.round(n.y - minY + MARGIN); }
  for (const g of groupBoxes) if (g.w > 0) { g.x = Math.round(g.x - minX + MARGIN); g.y = Math.round(g.y - minY + MARGIN); }
  const width = Math.max(...nodes.map((n) => n.x + n.w), ...groupBoxes.map((g) => g.x + g.w)) + MARGIN;
  const height = Math.max(...nodes.map((n) => n.y + n.h), ...groupBoxes.map((g) => g.y + g.h)) + MARGIN;
  return { nodes, edges, groups: groupBoxes, width: Math.round(width), height: Math.round(height) };
}

export async function compile(spec, ctx, issues = new IssueList()) {
  validate(spec, issues);
  if (!issues.ok) return { spec: null, issues };
  const laid = layout(spec);
  const hidden = new Set(spec.hidden ?? []);
  const visibleSoFar = new Set();
  // Node, edge, group and annotation labels are drawn as SVG text: plain text, no Markdown.
  const render = (label) => (label === null || label === undefined ? null : toText(label));
  const steps = spec.steps.map((s) => {
    for (const id of s.show ?? []) visibleSoFar.add(id);
    return {
      caption: renderText(ctx, s.caption),
      highlight: s.highlight ?? [],
      dim: s.dim ?? [],
      hidden: [...hidden].filter((id) => !visibleSoFar.has(id)),
      annotate: (s.annotate ?? []).map((a) => ({ id: a.id, text: toText(a.text) })),
    };
  });
  return {
    spec: {
      kind: 'diagram',
      layout: { width: laid.width, height: laid.height },
      groups: laid.groups.map((g) => ({ id: g.id, label: render(g.label), x: g.x, y: g.y, w: g.w, h: g.h })),
      nodes: laid.nodes.map((n) => ({ id: n.id, label: render(n.label), group: n.group, shape: n.shape, x: n.x, y: n.y, w: n.w, h: n.h })),
      edges: laid.edges.map((e) => ({ id: e.id, from: e.from, to: e.to, label: render(e.label), kind: e.kind })),
      steps,
    },
    issues,
  };
}
