// sequence: actors with lifelines and messages over time; steps reveal one message at a time.
import { IssueList, checkArray, checkEnum, checkId, checkLabel, checkText, isPlainObject, renderText, toText } from '../common.js';

export const MESSAGE_KINDS = ['sync', 'async', 'return', 'note'];

export const schema = {
  kind: 'sequence',
  summary: 'Actors with lifelines and messages in time order (HTTP request/response, CORS preflight, auth session, SSR + hydration, the React Native bridge). One message per step.',
  fields: {
    actors: '[{ id, label: { uk, en } | string }] — left to right',
    intro: '{ uk, en } — optional caption for a first step that shows only the actors',
    messages: '[{ from: actorId, to: actorId, label: { uk, en } | string, kind?: sync|async|return|note, caption: { uk, en }, note?: { uk, en } }] — a "note" is attached to the "from" lifeline (to may equal from)',
  },
};

export function validate(spec, issues = new IssueList()) {
  if (!isPlainObject(spec)) { issues.add('spec', 'must be a mapping'); return issues; }
  const ids = new Set();
  if (checkArray(issues, spec.actors, 'spec.actors', { min: 2 })) {
    spec.actors.forEach((a, i) => {
      const p = `spec.actors[${i}]`;
      if (!isPlainObject(a)) { issues.add(p, 'must be { id, label }'); return; }
      if (checkId(issues, a.id, `${p}.id`)) { if (ids.has(a.id)) issues.add(`${p}.id`, `duplicate actor id "${a.id}"`); ids.add(a.id); }
      checkLabel(issues, a.label, `${p}.label`);
    });
  }
  if (spec.intro !== undefined) checkText(issues, spec.intro, 'spec.intro');
  if (checkArray(issues, spec.messages, 'spec.messages', { min: 1 })) {
    spec.messages.forEach((m, i) => {
      const p = `spec.messages[${i}]`;
      if (!isPlainObject(m)) { issues.add(p, 'must be { from, to, label, caption }'); return; }
      if (!ids.has(m.from)) issues.add(`${p}.from`, `unknown actor "${m.from}"`);
      if (!ids.has(m.to)) issues.add(`${p}.to`, `unknown actor "${m.to}"`);
      checkLabel(issues, m.label, `${p}.label`);
      checkText(issues, m.caption, `${p}.caption`);
      checkEnum(issues, m.kind, `${p}.kind`, MESSAGE_KINDS, { optional: true });
      if (m.note !== undefined) checkText(issues, m.note, `${p}.note`);
      if (m.kind !== 'note' && m.from === m.to) issues.add(p, 'a message to the same actor must use kind: note');
    });
  }
  return issues;
}

export async function compile(spec, ctx, issues = new IssueList()) {
  validate(spec, issues);
  if (!issues.ok) return { spec: null, issues };
  // Actor, message and note labels are drawn as SVG text: plain text, no Markdown.
  const messages = spec.messages.map((m, i) => ({ id: `m${i + 1}`, from: m.from, to: m.to, label: toText(m.label), kind: m.kind ?? 'sync', note: m.note ? toText(m.note) : null }));
  const steps = [];
  if (spec.intro) steps.push({ caption: renderText(ctx, spec.intro), message: -1 });
  messages.forEach((m, i) => steps.push({ caption: renderText(ctx, spec.messages[i].caption), message: i }));
  return { spec: { kind: 'sequence', actors: spec.actors.map((a) => ({ id: a.id, label: toText(a.label) })), messages, steps }, issues };
}
