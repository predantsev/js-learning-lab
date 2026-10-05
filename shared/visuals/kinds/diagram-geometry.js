// Where the diagram player draws edges, edge labels and annotations. Shared by the compiler
// (shared/visuals/kinds/diagram.js sizes the picture so that nothing is clipped) and the player
// (app/src/visuals/players/Diagram.tsx), so both use the same numbers. No imports, no I/O.

/** Estimated width of small SVG text (the player's 11–12 px labels). */
const smallTextWidth = (text) => String(text).length * 6.8;

/** Room kept between a label box and the picture's edge. */
export const TEXT_MARGIN = 4;

/**
 * A label box moved sideways, if needed, so that it stays inside a picture `width` wide (the
 * compiler makes every picture at least as wide as its widest label box plus the margins).
 */
export function insideWidth(box, width) {
  const x = Math.max(TEXT_MARGIN, Math.min(box.x, width - TEXT_MARGIN - box.w));
  return x === box.x ? box : { ...box, x };
}

/** Point where the segment from the node center towards (tx, ty) leaves the node rectangle. */
export function border(node, tx, ty) {
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const sx = dx !== 0 ? node.w / 2 / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? node.h / 2 / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return [cx + dx * s, cy + dy * s];
}

/** The drawn line of an edge between two laid-out nodes, its midpoint and whether it is mostly vertical. */
export function edgeLine(a, b) {
  const [x1, y1] = border(a, b.x + b.w / 2, b.y + b.h / 2);
  const [x2, y2] = border(b, a.x + a.w / 2, a.y + a.h / 2);
  return { x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2, vertical: Math.abs(y2 - y1) > Math.abs(x2 - x1) };
}

/** Box of an edge label: right of a vertical edge, above a horizontal one. */
export function edgeLabelBox(line, label) {
  const w = smallTextWidth(label) + 10;
  return line.vertical ? { x: line.mx + 6, y: line.my - 9, w, h: 16 } : { x: line.mx - w / 2, y: line.my - 18, w, h: 16 };
}

/** Box of an edge annotation: under the label of a vertical edge, under a horizontal edge. */
export function edgeNoteBox(line, note) {
  const w = smallTextWidth(note) + 12;
  return line.vertical ? { x: line.mx + 6, y: line.my + 10, w, h: 18 } : { x: line.mx - w / 2, y: line.my + 6, w, h: 18 };
}

/** Box of a node annotation: centered under the node. */
export function nodeNoteBox(node, note) {
  const w = smallTextWidth(note) + 12;
  return { x: node.x + node.w / 2 - w / 2, y: node.y + node.h + 6, w, h: 18 };
}
