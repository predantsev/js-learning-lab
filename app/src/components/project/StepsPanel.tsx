// Project steps of the JavaScript stage: state per step (not done / checked by the platform /
// reference applied), the selected step's task and the offers to supply missing prior work.
import { useState } from 'react';
import { isStepDone, isStepSkipped, missingBefore, startingReference } from '@shared/capstone.js';
import { type Key, pick } from '../../lib/i18n';
import type { Doc } from '../../lib/persist';
import { useStore } from '../../lib/store';
import type { IndexUnit, L10n } from '../../lib/types';
import { type WorkspaceDoc, type WorkspaceStep, app, useLang, useT } from '../../state/app';
import { Html, Icon } from '../ui';
import { type Capstone, type CapstoneStep, resolveHtml } from './content';
import { dateTime } from './parts';
import { declineStarter, recordNudge, undoDeclineStarter, workspaceLang } from './workspace';

export interface StepRow { unit: string; unitTitle: L10n; plan: IndexUnit['capstoneStep']; step: CapstoneStep | null }

/** In-platform steps of the JavaScript stage in teaching order, authored or planned. */
export function stepRows(capstone: Capstone): StepRow[] {
  const js = app().index.stages.find((s) => s.id === 'JS');
  return (js?.units ?? [])
    .map((u) => ({ unit: u.id, unitTitle: u.title, plan: u.capstoneStep, step: capstone.steps.find((s) => s.unit === u.id) ?? null }))
    .filter((r) => (r.step ? r.step.mode === 'in-platform' : r.plan?.mode === 'in-platform'));
}

type StepStatus = 'done' | 'done-assisted' | 'skipped' | 'pending' | 'unpublished';
const statusOf = (row: StepRow, record: WorkspaceStep | undefined): StepStatus => {
  if (!row.step) return 'unpublished';
  if (isStepDone(record)) return record?.assisted ? 'done-assisted' : 'done';
  if (isStepSkipped(record)) return 'skipped';
  return 'pending';
};
const STATUS_ICON: Record<StepStatus, string> = { done: '✓', 'done-assisted': '✓', skipped: '⤼', pending: '○', unpublished: '·' };
const STATUS_KEY: Record<StepStatus, Key> = { done: 'project.step.done', 'done-assisted': 'project.step.doneAssisted', skipped: 'project.step.skipped', pending: 'project.step.pending', unpublished: 'project.step.unpublished' };

export function StepsPanel({ doc, capstone, rows, selected, current, onSelect, onStarter }: {
  doc: Doc<WorkspaceDoc>;
  capstone: Capstone;
  rows: StepRow[];
  selected: string | null;
  current: string | null;
  onSelect: (unit: string) => void;
  /** Open the starter dialog for the reference after `through` (null = CP-START). */
  onStarter: (through: string | null) => void;
}) {
  const t = useT();
  const lang = useLang();
  const ws = useStore(doc.store);
  const wsLang = workspaceLang(ws);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const row = rows.find((r) => r.unit === selected) ?? null;
  const step = row?.step ?? null;
  const record = selected ? ws.steps[selected] : undefined;
  const status = row ? statusOf(row, record) : 'unpublished';
  const missing = step && step.mode === 'in-platform' ? (missingBefore(capstone.steps, ws.steps, step.unit) as string[]) : [];
  const noFiles = Object.keys(ws.files).length === 0;
  const variant = row?.plan?.variants?.[capstone.id];
  const published = rows.filter((r) => r.step);
  const planned = rows.filter((r) => !r.step);
  const stepButton = (r: StepRow) => {
    const st = statusOf(r, ws.steps[r.unit]);
    return (
      <li key={r.unit}>
        <button type="button" className={`project-step-button step-${st}`} aria-current={r.unit === selected ? 'step' : undefined} data-unit={r.unit} onClick={() => onSelect(r.unit)}>
          <span className="step-icon" aria-hidden="true">{STATUS_ICON[st]}</span>
          <span className="step-name"><span className="step-unit">{r.unit}</span> {r.step ? pick(r.step.title, lang) : pick(r.unitTitle, lang)}</span>
          <span className="step-state">{t(STATUS_KEY[st])}{r.unit === current && st === 'pending' ? ` · ${t('project.step.current')}` : ''}</span>
        </button>
      </li>
    );
  };

  return (
    <>
      <section className="project-card" aria-labelledby="project-steps-title">
        <h2 id="project-steps-title" className="project-card-title">{t('project.stepsTitle')}</h2>
        <ol className="project-steps">{published.map(stepButton)}</ol>
        {planned.length > 0 && (
          <details className="planned-steps" open={planned.some((r) => r.unit === selected)}>
            <summary>{t('project.plannedSteps', { n: planned.length })}</summary>
            <ol className="project-steps project-steps-planned">{planned.map(stepButton)}</ol>
          </details>
        )}
      </section>

      {noFiles && (
        <section className="banner banner-info" role="status">
          <div><strong>{t('project.noFilesTitle')}</strong><p>{t('project.noFilesBody')}</p></div>
          <button type="button" className="btn btn-primary" onClick={() => onStarter(null)}>{t('project.noFilesApply')}</button>
        </section>
      )}

      {selected && (
        <section className="project-card project-step-detail" aria-labelledby="project-step-title" data-step={selected}>
          <div className="project-step-head">
            <span className="eyebrow">{selected}</span>
            <span className={`badge step-badge step-${status}`} data-status={status}>{t(STATUS_KEY[status])}</span>
          </div>
          <h2 id="project-step-title" className="project-card-title">{step ? pick(step.title, lang) : row ? pick(row.unitTitle, lang) : selected}</h2>
          {!step && (
            <>
              <p className="ws-note">{t('project.unpublishedBody')}</p>
              {variant && <p>{pick(variant, lang)}</p>}
            </>
          )}
          {step && step.mode === 'in-platform' && missing.length > 0 && !noFiles && (
            record?.starterDeclinedAt ? (
              <p className="ws-note starter-declined">{t('project.missingDeclined')} <button type="button" className="btn btn-quiet" onClick={() => undoDeclineStarter(doc, step.unit)}>{t('project.missingReconsider')}</button></p>
            ) : (
              <div className="banner banner-info starter-offer" role="status">
                <div><strong>{t('project.missingTitle')}</strong><p>{t('project.missingBody', { units: missing.join(', ') })}</p></div>
                <div className="banner-actions">
                  <button type="button" className="btn btn-primary" onClick={() => onStarter(startingReference(capstone.steps, step.unit))}>{t('project.missingPreview')}</button>
                  <button type="button" className="btn" onClick={() => declineStarter(doc, step.unit)}>{t('project.missingKeep')}</button>
                </div>
              </div>
            )
          )}
          {step && (
            <>
              <details className="step-about" open={!record?.attempts && status === 'pending'}>
                <summary>{t('project.aboutStep')}</summary>
                <Html html={step.intro[lang]} lang={lang} className="prose step-intro" />
              </details>
              {step.mode === 'in-platform' ? (
                <div className="step-task">
                  <h3>{t('project.stepTask')}</h3>
                  <Html html={resolveHtml(step.instructions[lang], step.strings, wsLang)} lang={lang} className="prose" />
                  {step.nudge && (nudgeOpen || record?.nudgeAt ? (
                    <div className="hint"><span className="label">{t('project.nudge')}</span><Html html={resolveHtml(step.nudge[lang], step.strings, wsLang)} lang={lang} className="prose" /></div>
                  ) : (
                    <button type="button" className="btn btn-quiet hint-toggle" onClick={() => { recordNudge(doc, step.unit); setNudgeOpen(true); }}><Icon name="bulb" /> {t('project.nudgeShow')}</button>
                  ))}
                  {record?.lastCheck && <p className="ws-note">{t('project.lastCheck', { date: dateTime(record.lastCheck.at, lang), passed: record.lastCheck.passed, total: record.lastCheck.total })}</p>}
                  {status === 'pending' && !noFiles && <button type="button" className="btn btn-quiet skip-step" onClick={() => onStarter(step.unit)}>{t('project.skipStep')}</button>}
                </div>
              ) : <p className="ws-note">{t('project.localBody')}</p>}
            </>
          )}
        </section>
      )}
    </>
  );
}
