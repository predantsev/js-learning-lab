// Turns the plan into the text of a PR description: what changed, and how a reviewer verifies it.
import { ACTIONS, REQUIREMENTS } from './requirements.js';

export function renderPr({ pr, plan, decision, runbook }) {
  const lines = [`# ${pr.title}`, '', pr.summary, '', '## %%howToVerify%%'];
  for (const requirement of REQUIREMENTS) {
    const row = plan.find((r) => r.requirement === requirement.id);
    if (!row) {
      lines.push(`- ${requirement.text}: %%noRow%%`);
      continue;
    }
    const steps = row.steps.map((step) => ACTIONS[step] ?? `? ${step}`).join(' → ');
    lines.push(`- ${requirement.text} (${row.component || '?'}): ${steps || '?'} — %%evidence%%: ${row.evidence || '?'}`);
  }
  lines.push('', '## %%decisionTitle%%', decision.context);
  for (const option of decision.options) {
    lines.push(`- ${option.id}: ${option.failureMode || '?'}`);
  }
  lines.push(`%%chosen%%: ${decision.choice || '?'}. ${decision.consequences.join(' ')}`);
  lines.push('', '## Runbook', runbook.symptom);
  runbook.steps.forEach((step, i) => lines.push(`${i + 1}. ${ACTIONS[step] ?? `? ${step}`}`));
  return lines.join('\n');
}
