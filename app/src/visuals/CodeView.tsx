// Code panel with a small JavaScript/JSX tokenizer (syntax tokens from tokens.css) and a current line.
// Long lines first make the font smaller (down to a legible minimum, visuals.css .viz-code), then
// wrap under their own line number: the panel never scrolls sideways, so identifiers stay as written.
import { type CSSProperties, useEffect, useMemo, useRef, type ReactNode } from 'react';

type Token = { cls: string | null; text: string };

const KEYWORDS = new Set(['async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'from', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'of', 'return', 'static', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'true', 'false', 'null', 'undefined']);

/** Tokenize one line. `state` carries an open block comment or template literal across lines. */
export function tokenizeLine(line: string, state: { comment: boolean; template: boolean }): Token[] {
  const out: Token[] = [];
  let i = 0;
  const push = (cls: string | null, text: string) => { if (text) out.push({ cls, text }); };
  while (i < line.length) {
    const rest = line.slice(i);
    if (state.comment) {
      const end = rest.indexOf('*/');
      if (end === -1) { push('comment', rest); i = line.length; }
      else { push('comment', rest.slice(0, end + 2)); i += end + 2; state.comment = false; }
      continue;
    }
    if (state.template) {
      const end = rest.search(/(?<!\\)`/);
      if (end === -1) { push('string', rest); i = line.length; }
      else { push('string', rest.slice(0, end + 1)); i += end + 1; state.template = false; }
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = /^\/\/.*/.exec(rest))) { push('comment', m[0]); i += m[0].length; continue; }
    if (rest.startsWith('/*')) { const end = rest.indexOf('*/'); if (end === -1) { push('comment', rest); i = line.length; state.comment = true; } else { push('comment', rest.slice(0, end + 2)); i += end + 2; } continue; }
    if ((m = /^(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/.exec(rest))) { push('string', m[0]); i += m[0].length; continue; }
    if (rest.startsWith('`')) { const end = rest.slice(1).search(/(?<!\\)`/); if (end === -1) { push('string', rest); i = line.length; state.template = true; } else { push('string', rest.slice(0, end + 2)); i += end + 2; } continue; }
    if ((m = /^(?:0x[\da-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?n?)/i.exec(rest))) { push('number', m[0]); i += m[0].length; continue; }
    if ((m = /^<\/?[A-Za-z][\w.-]*/.exec(rest)) && /^<\/?[A-Z]|^<\/?[a-z]+(?=[\s/>])/.test(m[0])) { push('tag', m[0]); i += m[0].length; continue; }
    if ((m = /^[A-Za-z_$][\w$]*/.exec(rest))) {
      const word = m[0];
      const after = rest.slice(word.length);
      const before = out.length ? out[out.length - 1].text : '';
      if (KEYWORDS.has(word)) push('keyword', word);
      else if (/^\s*\(/.test(after)) push('fn', word);
      else if (before.endsWith('.')) push('prop', word);
      else push(null, word);
      i += word.length;
      continue;
    }
    if ((m = /^\s+/.exec(rest))) { push(null, m[0]); i += m[0].length; continue; }
    push('punct', rest[0]);
    i += 1;
  }
  return out;
}

export function tokenize(code: string): Token[][] {
  const state = { comment: false, template: false };
  return code.replace(/\n$/, '').split('\n').map((line) => tokenizeLine(line, state));
}

export type CodeViewProps = {
  code: string;
  currentLine: number | null;
  /** Secondary highlighted lines (e.g. the lines of the frames below the top one). */
  context?: number[];
  label: string;
  currentLabel: (n: number) => string;
  file?: string | null;
  maxLines?: number;
  flashKey?: number;
  children?: ReactNode;
};

export function CodeView({ code, currentLine, context = [], label, currentLabel, file = null, maxLines = 14, flashKey = 0, children }: CodeViewProps) {
  const lines = tokenize(code);
  const longest = useMemo(() => Math.max(1, ...code.replace(/\n$/, '').split('\n').map((l) => l.replace(/\t/g, '  ').length)), [code]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || currentLine === null) return;
    const el = ref.current.querySelector<HTMLElement>(`[data-line="${currentLine}"]`);
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [currentLine]);
  const style = { maxHeight: `calc(${maxLines} * 1.55em + 0.6rem)`, '--viz-code-chars': longest } as CSSProperties;
  return (
    <section className="viz-panel viz-code-panel" aria-label={label}>
      <header className="viz-panel-head"><span>{label}</span>{file ? <code className="viz-file">{file}</code> : null}{children}</header>
      <div className="viz-code" ref={ref} style={style} role="group" aria-label={label}>
        {lines.map((tokens, i) => {
          const n = i + 1;
          const current = currentLine === n;
          return (
            <div key={current ? `${n}-${flashKey}` : n} className={`viz-code-line${current ? ' viz-current viz-changed' : ''}${context.includes(n) && !current ? ' viz-context' : ''}`} data-line={n} aria-current={current ? 'step' : undefined}>
              <span className="viz-gutter" aria-hidden="true">{current ? '▶' : ''}{n}</span>
              {current ? <span className="viz-sr">{currentLabel(n)}: </span> : null}
              <span className="viz-code-text">{tokens.map((t, j) => (t.cls ? <span key={j} className={`viz-syn-${t.cls}`}>{t.text}</span> : <span key={j}>{t.text}</span>))}{tokens.length === 0 ? ' ' : null}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
