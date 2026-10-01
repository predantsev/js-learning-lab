// CodeMirror 6 editor. Colors come from the style tokens, so all three styles and both
// appearances stay readable. Tab indents; Esc then Tab leaves the editor (announced via aria-describedby).
import { indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { sql } from '@codemirror/lang-sql';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { type Diagnostic, setDiagnostics } from '@codemirror/lint';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { basicSetup } from 'codemirror';
import { useEffect, useRef } from 'react';

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier, t.controlKeyword, t.definitionKeyword, t.moduleKeyword], color: 'var(--ll-syn-keyword)' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--ll-syn-string)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--ll-syn-number)' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: 'var(--ll-syn-comment)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.className, t.typeName], color: 'var(--ll-syn-fn)' },
  { tag: [t.propertyName, t.attributeName], color: 'var(--ll-syn-prop)' },
  { tag: [t.tagName, t.angleBracket], color: 'var(--ll-syn-tag)' },
  { tag: [t.punctuation, t.bracket, t.operator], color: 'var(--ll-syn-punct)' },
  { tag: t.invalid, color: 'var(--ll-danger)' },
]);

const theme = EditorView.theme({
  '&': { color: 'var(--ll-ink)', backgroundColor: 'transparent', fontSize: '0.875rem' },
  '.cm-content': { fontFamily: 'var(--ll-font-mono)', lineHeight: '1.7', caretColor: 'var(--ll-accent)', padding: '12px 0' },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--ll-dim)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--ll-soft) 55%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--ll-ink)' },
  // Visible focus (REQ-031): the same ring as other controls, drawn inside the scroll box.
  '&.cm-focused': { outline: '2px solid var(--ll-focus)', outlineOffset: '-2px' },
  '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--ll-accent)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: 'color-mix(in srgb, var(--ll-accent) 28%, transparent) !important' },
  '.cm-tooltip': { backgroundColor: 'var(--ll-panel)', color: 'var(--ll-ink)', border: '1px solid var(--ll-line)', borderRadius: '6px' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: 'var(--ll-soft)', color: 'var(--ll-ink)' },
  '.cm-panels': { backgroundColor: 'var(--ll-panel)', color: 'var(--ll-ink)', borderColor: 'var(--ll-line)' },
  '.cm-lintRange-error': { backgroundImage: 'none', borderBottom: '2px wavy var(--ll-danger)' },
  '.cm-matchingBracket': { backgroundColor: 'color-mix(in srgb, var(--ll-accent) 22%, transparent)', outline: 'none' },
  '.cm-foldPlaceholder': { backgroundColor: 'var(--ll-soft)', border: 'none', color: 'var(--ll-dim)' },
  '.cm-scroller': { overflow: 'auto' },
});

function languageFor(path: string) {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  switch (ext) {
    case 'js': case 'mjs': case 'cjs': return javascript();
    case 'jsx': return javascript({ jsx: true });
    case 'ts': return javascript({ typescript: true });
    case 'tsx': return javascript({ typescript: true, jsx: true });
    case 'html': return html();
    case 'css': return css();
    case 'json': return json();
    case 'md': return markdown();
    case 'sql': return sql();
    default: return [];
  }
}

export interface EditorIssue { line: number; column?: number | null; message: string }
interface Props {
  path: string;
  value: string;
  readOnly?: boolean;
  ariaLabel: string;
  describedBy?: string;
  issues?: EditorIssue[];
  minHeight?: string;
  onChange?: (value: string) => void;
}

export function CodeEditor({ path, value, readOnly = false, ariaLabel, describedBy, issues = [], minHeight = '9rem', onChange }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // True while the editor is being updated from `value` (a language switch, a reload from disk):
  // such changes are not learner edits and must not be saved back as if they were.
  const syncing = useRef(false);
  const readOnlyCompartment = useRef(new Compartment());

  useEffect(() => {
    if (!host.current) return undefined;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          languageFor(path),
          syntaxHighlighting(highlight),
          theme,
          EditorState.tabSize.of(2),
          readOnlyCompartment.current.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel, ...(describedBy ? { 'aria-describedby': describedBy } : {}), spellcheck: 'false', autocapitalize: 'off' }),
          EditorView.updateListener.of((update) => { if (update.docChanged && !syncing.current) onChangeRef.current?.(update.state.doc.toString()); }),
        ],
      }),
    });
    view.current = v;
    return () => { v.destroy(); view.current = null; };
    // The editor is recreated per file; value changes are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    const v = view.current;
    if (!v || v.state.doc.toString() === value) return;
    syncing.current = true;
    try {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    } finally {
      syncing.current = false;
    }
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: readOnlyCompartment.current.reconfigure([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]) });
  }, [readOnly]);

  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const diagnostics: Diagnostic[] = issues.filter((i) => i.line >= 1 && i.line <= v.state.doc.lines).map((i) => {
      const line = v.state.doc.line(i.line);
      const from = Math.min(line.to, line.from + Math.max(0, (i.column ?? 1) - 1));
      return { from, to: Math.max(from, line.to), severity: 'error', message: i.message };
    });
    v.dispatch(setDiagnostics(v.state, diagnostics));
  }, [issues, value]);

  return <div ref={host} className="code-editor" style={{ minHeight }} data-path={path} />;
}
