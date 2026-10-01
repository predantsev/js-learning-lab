// Rendering of trace values and heap entries (shared by code-trace and memory-graph).
import type { Heap, HeapEntry, TraceValue } from './types';
import type { VisualLabels } from './labels';

export function heapSummary(entry: HeapEntry | undefined, id: string | number): string {
  if (!entry) return `#${id}`;
  switch (entry.t) {
    case 'array': return `Array(${entry.length})`;
    case 'object': return entry.ctor ? `${entry.ctor} {…}` : '{…}';
    case 'function': return `ƒ ${entry.name || '(anonymous)'}`;
    case 'class': return `class ${entry.name}`;
    case 'map': return `Map(${entry.size})`;
    case 'set': return `Set(${entry.size})`;
    case 'error': return `${entry.name}`;
    case 'date': return 'Date';
    case 'regexp': return entry.v;
    case 'promise': return 'Promise';
    default: return '{…}';
  }
}

export function valueText(value: TraceValue | undefined, heap: Heap, labels: VisualLabels): string {
  if (!value) return '';
  switch (value.t) {
    case 'string': return JSON.stringify(value.v) + (value.cut ? '…' : '');
    case 'number': case 'boolean': case 'bigint': case 'symbol': return String(value.v);
    case 'null': return 'null';
    case 'undefined': return 'undefined';
    case 'uninit': return labels.uninitialized;
    case 'empty': return '<empty>';
    case 'accessor': return '(getter)';
    case 'ref': return `#${value.id} ${heapSummary(heap[String(value.id)], value.id)}`;
    default: return '…';
  }
}

export function Value({ value, heap, labels, flash = false }: { value: TraceValue | undefined; heap: Heap; labels: VisualLabels; flash?: boolean }) {
  if (!value) return null;
  if (value.t === 'uninit') return <span className={`viz-value viz-uninit${flash ? ' viz-changed' : ''}`}>{labels.uninitialized}</span>;
  if (value.t === 'ref') {
    const entry = heap[String(value.id)];
    return (
      <span className={`viz-value viz-ref${flash ? ' viz-changed' : ''}`} data-ref={value.id} title={labels.reference(String(value.id))}>
        <span className="viz-ref-id">#{value.id}</span> {heapSummary(entry, value.id)}
      </span>
    );
  }
  const cls = value.t === 'string' ? 'viz-syn-string' : value.t === 'number' || value.t === 'bigint' ? 'viz-syn-number' : value.t === 'boolean' || value.t === 'null' || value.t === 'undefined' ? 'viz-syn-keyword' : '';
  return <span className={`viz-value ${cls}${flash ? ' viz-changed' : ''}`}>{valueText(value, heap, labels)}</span>;
}

export function HeapEntryView({ id, entry, heap, labels, scopeName, flash = false }: { id: string; entry: HeapEntry; heap: Heap; labels: VisualLabels; scopeName?: string | null; flash?: boolean }) {
  const rows: { key: string; value: TraceValue }[] = [];
  if (entry.t === 'object') for (const [k, v] of entry.props) rows.push({ key: k, value: v });
  if (entry.t === 'array') entry.items.forEach((v, i) => rows.push({ key: String(i), value: v }));
  if (entry.t === 'set') entry.items.forEach((v, i) => rows.push({ key: String(i), value: v }));
  if (entry.t === 'map') entry.entries.forEach(([k, v]) => rows.push({ key: valueText(k, heap, labels), value: v }));
  const more = entry.t === 'object' || entry.t === 'array' ? entry.more : 0;
  return (
    <div className={`viz-heap-entry${flash ? ' viz-changed' : ''}`} data-heap-id={id}>
      <div className="viz-heap-head"><span className="viz-ref-id">#{id}</span> <span className="viz-heap-summary">{heapSummary(entry, id)}</span></div>
      {entry.t === 'function' || entry.t === 'class' ? (
        <div className="viz-heap-fn">{scopeName ? <span className="viz-closure">{labels.closureOf(scopeName)}</span> : null}</div>
      ) : null}
      {entry.t === 'error' ? <div className="viz-heap-fn">{entry.name}: {entry.message}</div> : null}
      {rows.length > 0 ? (
        <table className="viz-table viz-heap-table">
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}><th scope="row">{r.key}</th><td><Value value={r.value} heap={heap} labels={labels} /></td></tr>
            ))}
            {more > 0 ? <tr><td colSpan={2} className="viz-dim">{labels.moreItems(more)}</td></tr> : null}
          </tbody>
        </table>
      ) : entry.t === 'object' || entry.t === 'array' ? <div className="viz-dim viz-heap-fn">{'{ }'}</div> : null}
    </div>
  );
}
