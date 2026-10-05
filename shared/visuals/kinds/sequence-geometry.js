// How wide the sequence player draws a picture. Shared by the compiler (shared/visuals/kinds/
// sequence.js records layout.width, which the content validator checks against the lesson column)
// and the player (app/src/visuals/players/Sequence.tsx). No imports, no I/O.

/** Greedy word wrap by character budget (SVG has no automatic wrapping). */
export function wrap(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && `${line} ${word}`.length > maxChars) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
    while (line.length > maxChars) { lines.push(line.slice(0, maxChars)); line = line.slice(maxChars); }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/** Space between two actor boxes. */
export const ACTOR_GAP = 40;

/**
 * Actor boxes: labels wrap to at most two lines, preferably of 14 characters (20 when a label needs
 * more room), and the box is as wide as the longest line of any actor in either language
 * (96–150 px). `actors[].label` is { uk, en }.
 */
export function actorLayout(actors) {
  const labels = actors.flatMap((a) => Object.values(a.label));
  const chars = labels.every((l) => wrap(l, 14).length <= 2) ? 14 : 20;
  const longest = Math.max(4, ...labels.flatMap((l) => wrap(l, chars).map((line) => line.length)));
  return { width: Math.min(150, Math.max(96, Math.ceil(longest * 6.6) + 22)), chars };
}

/** Natural width of the whole picture: 20 px margins, the actor columns and the gaps between them. */
export function sequenceWidth(actors) {
  const { width } = actorLayout(actors);
  return 40 + actors.length * width + (actors.length - 1) * ACTOR_GAP;
}
