// Prints the PR description built from plan.js — exactly what a reviewer would read.
import { decision, plan, pr, runbook } from './plan.js';
import { renderPr } from './render.js';

console.log(renderPr({ pr, plan, decision, runbook }));
