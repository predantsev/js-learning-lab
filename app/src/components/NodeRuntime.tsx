// What the learner is told about the isolated Node.js runtime (REQ-014, REQ-023): the runtime label
// with the real engine version, why it is unavailable when it is, and its limits — the block's own
// declared capabilities plus what the server measured on this machine.
import type { Capabilities, ExampleBlock, ExerciseBlock, Lang } from '../lib/types';
import { useT } from '../state/app';
import { Html, Icon } from './ui';
import { nodeFeature } from './useNodeRunner';

/** Limits as localized sentences; the server's own technical list (English) is one click further. */
export function NodeLimitsList({ capabilities }: { capabilities?: Capabilities | null }) {
  const t = useT();
  const f = nodeFeature();
  const limits = f.limits ?? {};
  const timeoutMs = capabilities?.timeoutMs ?? limits.timeoutMs?.default ?? 10_000;
  const network = capabilities === undefined || capabilities === null ? 'default' : capabilities.network ?? 'none';
  const items = [
    t('ws.node.limit.folder'),
    t('ws.node.limit.time', { s: Math.round(timeoutMs / 1000) }),
    t('ws.node.limit.output', { kb: Math.round((limits.outputBytes ?? 200 * 1024) / 1024) }),
    t('ws.node.limit.memory', { mb: limits.heapMb ?? 256 }),
    t(network === 'loopback' ? 'ws.node.limit.networkLoopback' : network === 'default' ? 'ws.node.limit.networkDefault' : 'ws.node.limit.networkNone'),
    t('ws.node.limit.processes'),
    t(capabilities?.workers ? 'ws.node.limit.workersOn' : 'ws.node.limit.workersOff'),
    `${t('ws.node.limit.honesty')} ${t(f.osSandbox?.active ? 'ws.node.limit.osOn' : 'ws.node.limit.osOff')}`,
  ];
  return (
    <>
      <ul className="node-limit-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>
      {f.limitations && f.limitations.length > 0 && (
        <details className="node-limitations">
          <summary>{t('ws.node.limit.details')}</summary>
          <ul lang="en">{f.limitations.map((line) => <li key={line}>{line}</li>)}</ul>
        </details>
      )}
    </>
  );
}

/** Runtime note under the editor of an isolated-node block (replaces the browser runtime note). */
export function NodeRuntimeNote({ block, lang }: { block: ExampleBlock | ExerciseBlock; lang: Lang }) {
  const t = useT();
  const f = nodeFeature();
  return (
    <>
      <p className="runtime-note"><Icon name="info" size={13} /> {t('ws.runtime.isolated-node')}{f.available && f.node ? ` · ${t('ws.node.engine', { version: f.node })}` : ''}</p>
      {!f.available && <p className="ws-note node-unavailable" role="note"><Icon name="warn" size={13} /> {t('ws.nodeUnavailable', { reason: f.reason ?? '' })}</p>}
      <details className="limits node-limits">
        <summary>{t('ws.node.limits')}</summary>
        {block.limits && <Html html={block.limits[lang]} lang={lang} className="prose" />}
        <NodeLimitsList capabilities={block.capabilities ?? {}} />
      </details>
    </>
  );
}

/** Settings → "How code runs": the Node.js runtime of this installation. */
export function NodeRuntimeSettings() {
  const t = useT();
  const f = nodeFeature();
  return (
    <div className="node-settings">
      <h3>{t('settings.nodeRuntime')}</h3>
      <p>{f.available ? t('settings.nodeAvailable', { version: f.node ?? '' }) : t('ws.nodeUnavailable', { reason: f.reason ?? '' })}</p>
      <NodeLimitsList />
    </div>
  );
}
