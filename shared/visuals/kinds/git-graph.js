// git-graph: commits, branches, HEAD and working tree / staging per step. The author writes git
// operations; a small simulator derives every state, so a graph can never contradict git's rules.
import { IssueList, checkArray, checkEnum, checkText, isPlainObject, nonEmpty, renderText } from '../common.js';

export const OPS = ['init', 'modify', 'stage', 'commit', 'branch', 'checkout', 'merge', 'resolve', 'rebase', 'reset', 'restore', 'note'];

export const schema = {
  kind: 'git-graph',
  summary: 'Commits, branches, HEAD and the working tree / staging area step by step: commit, branch, merge (fast-forward or merge commit, with conflicts), rebase, reset, restore. States are simulated from the operations.',
  fields: {
    steps: '[{ op, caption: { uk, en }, …op fields }]',
    'op: init': '{ branch?: "main", args?: "-b main" } — start an empty repository; `args` are shown after "git init" (a -b / --initial-branch name also names the branch)',
    'op: modify': '{ files: [paths] } — edit files in the working tree',
    'op: stage': '{ files: [paths] } — git add',
    'op: commit': '{ message, id?: "c3", files?: [paths] } — commits the staged files (plus "files"); after resolving a conflict it creates the merge commit',
    'op: branch': '{ name, checkout?: true } — create a branch at HEAD (git switch -c)',
    'op: checkout': '{ name } (a branch) or { commit: id } (detached HEAD)',
    'op: merge': '{ from: branch, message?, conflict?: [paths], noFastForward?: true }',
    'op: resolve': '{ files: [paths] } — mark conflicted files resolved and staged',
    'op: rebase': '{ onto: branch } — replay the current branch commits as new commits (ids get a prime: c3′)',
    'op: reset': '{ to: commitId | branch, mode?: soft|mixed|hard }',
    'op: restore': '{ files: [paths], staged?: true } — discard working tree changes or unstage',
    'op: note': '{} — no change, caption only',
  },
};

/** The branch named by `git init` arguments (-b <name>, --initial-branch <name> or =<name>), or null. */
const initBranchArg = (args) => /(?:^|\s)(?:-b|--initial-branch)(?:\s+|=)(\S+)/.exec(args)?.[1] ?? null;

const fileList = (issues, value, path) => {
  if (!Array.isArray(value) || value.length === 0 || !value.every((f) => nonEmpty(f))) { issues.add(path, 'must be a non-empty list of file paths'); return []; }
  return value;
};

export function validate(spec, issues = new IssueList()) {
  if (!isPlainObject(spec)) { issues.add('spec', 'must be a mapping'); return issues; }
  if (!checkArray(issues, spec.steps, 'spec.steps', { min: 1 })) return issues;
  spec.steps.forEach((s, i) => {
    const p = `spec.steps[${i}]`;
    if (!isPlainObject(s)) { issues.add(p, 'must be a mapping'); return; }
    checkText(issues, s.caption, `${p}.caption`);
    if (!checkEnum(issues, s.op, `${p}.op`, OPS)) return;
    switch (s.op) {
      case 'init':
        if (s.args !== undefined && !nonEmpty(s.args)) issues.add(`${p}.args`, 'must be the text after "git init", for example "-b main"');
        else if (nonEmpty(s.args) && nonEmpty(s.branch) && initBranchArg(s.args) !== null && initBranchArg(s.args) !== s.branch) issues.add(`${p}.args`, `names the branch "${initBranchArg(s.args)}" but branch is "${s.branch}"`);
        break;
      case 'modify': case 'stage': case 'resolve': case 'restore': fileList(issues, s.files, `${p}.files`); break;
      case 'commit': if (!nonEmpty(s.message)) issues.add(`${p}.message`, 'a commit needs a message'); break;
      case 'branch': if (!nonEmpty(s.name)) issues.add(`${p}.name`, 'needs the branch name'); break;
      case 'checkout': if (!nonEmpty(s.name) && !nonEmpty(s.commit)) issues.add(p, 'needs "name" (branch) or "commit" (id)'); break;
      case 'merge': if (!nonEmpty(s.from)) issues.add(`${p}.from`, 'needs the branch to merge from'); if (s.conflict !== undefined) fileList(issues, s.conflict, `${p}.conflict`); break;
      case 'rebase': if (!nonEmpty(s.onto)) issues.add(`${p}.onto`, 'needs the branch to rebase onto'); break;
      case 'reset': if (!nonEmpty(s.to)) issues.add(`${p}.to`, 'needs a commit id or branch'); checkEnum(issues, s.mode, `${p}.mode`, ['soft', 'mixed', 'hard'], { optional: true }); break;
      default: break;
    }
  });
  if (spec.steps[0] && isPlainObject(spec.steps[0]) && spec.steps[0].op !== 'init') issues.add('spec.steps[0].op', 'the first step must be "init"');
  return issues;
}

class Repo {
  constructor() {
    this.commits = new Map();
    this.branches = new Map();
    this.lanes = new Map();
    this.head = { branch: 'main' };
    this.wt = { modified: new Set(), staged: new Set(), conflicted: new Set() };
    this.merging = null;
    this.order = 0;
    this.seq = 0;
  }
  headCommit() { return this.head.branch ? this.branches.get(this.head.branch) ?? null : this.head.detached; }
  isAncestor(a, b) { // is commit a an ancestor of (or equal to) b
    const seen = new Set();
    const stack = [b];
    while (stack.length) {
      const id = stack.pop();
      if (id === a) return true;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      stack.push(...(this.commits.get(id)?.parents ?? []));
    }
    return false;
  }
  addCommit({ id, parents, message, files, lane }) {
    const cid = id ?? `c${this.seq + 1}`;
    this.seq += 1;
    this.commits.set(cid, { id: cid, parents, message, files, lane, x: this.order++, orphaned: false });
    return cid;
  }
  snapshot() {
    return {
      commits: [...this.commits.values()].map((c) => ({ ...c, files: [...c.files] })),
      branches: [...this.branches.entries()].map(([name, at]) => ({ name, at, lane: this.lanes.get(name) ?? 0, current: this.head.branch === name })),
      head: this.head.branch ? { branch: this.head.branch } : { detached: this.head.detached },
      workingTree: { modified: [...this.wt.modified], staged: [...this.wt.staged], conflicted: [...this.wt.conflicted] },
      merging: this.merging,
    };
  }
}

const q = (s) => `"${s}"`;

export function simulate(steps, issues = new IssueList()) {
  const repo = new Repo();
  const out = [];
  steps.forEach((s, i) => {
    const p = `spec.steps[${i}]`;
    const changed = [];
    let command = '';
    const err = (m) => issues.add(p, m);
    const laneFor = (name) => { if (!repo.lanes.has(name)) repo.lanes.set(name, repo.lanes.size); return repo.lanes.get(name); };
    const currentBranch = () => repo.head.branch;
    switch (s.op) {
      case 'init': {
        const name = s.branch ?? (nonEmpty(s.args) ? initBranchArg(s.args) : null) ?? 'main';
        repo.branches.set(name, null);
        laneFor(name);
        repo.head = { branch: name };
        command = nonEmpty(s.args) ? `git init ${s.args.trim()}` : 'git init';
        changed.push(name);
        break;
      }
      case 'modify':
        for (const f of s.files) { repo.wt.modified.add(f); changed.push(f); }
        command = `edit ${s.files.join(', ')}`;
        break;
      case 'stage':
        for (const f of s.files) {
          if (!repo.wt.modified.has(f)) err(`"${f}" has no working tree change to stage (add a modify step first)`);
          repo.wt.modified.delete(f); repo.wt.staged.add(f); changed.push(f);
        }
        command = `git add ${s.files.join(' ')}`;
        break;
      case 'commit': {
        if (repo.wt.conflicted.size > 0) { err('cannot commit while files are still conflicted (resolve them first)'); break; }
        const files = new Set([...repo.wt.staged, ...(s.files ?? [])]);
        if (s.id !== undefined && repo.commits.has(s.id)) { err(`commit id "${s.id}" already exists`); break; }
        const parent = repo.headCommit();
        const parents = parent ? [parent] : [];
        if (repo.merging) { parents.push(repo.branches.get(repo.merging)); }
        const branch = currentBranch();
        const lane = branch ? laneFor(branch) : (parent ? repo.commits.get(parent).lane : 0);
        const id = repo.addCommit({ id: s.id, parents, message: s.message, files: [...files], lane });
        if (branch) repo.branches.set(branch, id); else repo.head = { detached: id };
        repo.wt.staged.clear();
        for (const f of files) repo.wt.modified.delete(f);
        repo.merging = null;
        command = `git commit -m ${q(s.message)}`;
        changed.push(id, branch ?? 'HEAD');
        break;
      }
      case 'branch': {
        if (repo.branches.has(s.name)) { err(`branch "${s.name}" already exists`); break; }
        repo.branches.set(s.name, repo.headCommit());
        laneFor(s.name);
        if (s.checkout !== false) { repo.head = { branch: s.name }; command = `git switch -c ${s.name}`; } else command = `git branch ${s.name}`;
        changed.push(s.name);
        break;
      }
      case 'checkout': {
        if (s.name !== undefined) {
          if (!repo.branches.has(s.name)) { err(`unknown branch "${s.name}"`); break; }
          repo.head = { branch: s.name };
          command = `git switch ${s.name}`;
          changed.push(s.name);
        } else {
          if (!repo.commits.has(s.commit)) { err(`unknown commit "${s.commit}"`); break; }
          repo.head = { detached: s.commit };
          command = `git checkout ${s.commit}`;
          changed.push(s.commit);
        }
        break;
      }
      case 'merge': {
        if (!repo.branches.has(s.from)) { err(`unknown branch "${s.from}"`); break; }
        const branch = currentBranch();
        if (!branch) { err('cannot merge with a detached HEAD in this visual'); break; }
        const ours = repo.branches.get(branch);
        const theirs = repo.branches.get(s.from);
        command = `git merge ${s.from}`;
        if (!theirs) { err(`branch "${s.from}" has no commits`); break; }
        if (repo.isAncestor(theirs, ours)) { err(`"${s.from}" is already merged into ${branch} (nothing to merge)`); break; }
        if (ours && repo.isAncestor(ours, theirs) && s.noFastForward !== true) {
          repo.branches.set(branch, theirs);
          changed.push(branch);
          command += '   # fast-forward';
          break;
        }
        if (s.conflict && s.conflict.length > 0) {
          for (const f of s.conflict) repo.wt.conflicted.add(f);
          repo.merging = s.from;
          changed.push(...s.conflict);
          command += '   # CONFLICT';
          break;
        }
        const id = repo.addCommit({ id: s.id, parents: [ours, theirs].filter(Boolean), message: s.message ?? `Merge branch '${s.from}'`, files: [], lane: laneFor(branch) });
        repo.branches.set(branch, id);
        changed.push(id, branch);
        break;
      }
      case 'resolve':
        for (const f of s.files) {
          if (!repo.wt.conflicted.has(f)) err(`"${f}" is not conflicted`);
          repo.wt.conflicted.delete(f); repo.wt.staged.add(f); changed.push(f);
        }
        command = `git add ${s.files.join(' ')}   # after editing the conflict markers`;
        break;
      case 'rebase': {
        if (!repo.branches.has(s.onto)) { err(`unknown branch "${s.onto}"`); break; }
        const branch = currentBranch();
        if (!branch) { err('rebase needs a checked-out branch'); break; }
        const base = repo.branches.get(s.onto);
        const tip = repo.branches.get(branch);
        // Commits reachable from tip but not from base, in order.
        const own = [];
        const seen = new Set();
        const walk = (id) => { if (!id || seen.has(id) || repo.isAncestor(id, base)) return; seen.add(id); for (const par of repo.commits.get(id).parents) walk(par); own.push(id); };
        walk(tip);
        if (own.length === 0) { err(`"${branch}" has no commits to replay onto ${s.onto}`); break; }
        let parent = base;
        for (const id of own) {
          const old = repo.commits.get(id);
          old.orphaned = true;
          const nid = repo.addCommit({ id: `${id}′`, parents: parent ? [parent] : [], message: old.message, files: old.files, lane: laneFor(branch) });
          changed.push(nid);
          parent = nid;
        }
        repo.branches.set(branch, parent);
        changed.push(branch);
        command = `git rebase ${s.onto}`;
        break;
      }
      case 'reset': {
        const target = repo.branches.has(s.to) ? repo.branches.get(s.to) : s.to;
        if (!repo.commits.has(target)) { err(`unknown commit or branch "${s.to}"`); break; }
        const branch = currentBranch();
        const mode = s.mode ?? 'mixed';
        const from = repo.headCommit();
        const undone = [];
        const seen = new Set();
        const walk = (id) => { if (!id || seen.has(id) || repo.isAncestor(id, target)) return; seen.add(id); undone.push(...repo.commits.get(id).files); for (const par of repo.commits.get(id).parents) walk(par); };
        walk(from);
        if (branch) repo.branches.set(branch, target); else repo.head = { detached: target };
        if (mode === 'hard') { repo.wt.modified.clear(); repo.wt.staged.clear(); }
        else if (mode === 'soft') for (const f of undone) repo.wt.staged.add(f);
        else for (const f of undone) repo.wt.modified.add(f);
        command = `git reset --${mode} ${s.to}`;
        changed.push(branch ?? 'HEAD');
        break;
      }
      case 'restore':
        for (const f of s.files) {
          if (s.staged === true) { if (!repo.wt.staged.has(f)) err(`"${f}" is not staged`); repo.wt.staged.delete(f); repo.wt.modified.add(f); }
          else { if (!repo.wt.modified.has(f)) err(`"${f}" has no working tree change to discard`); repo.wt.modified.delete(f); }
          changed.push(f);
        }
        command = `git restore ${s.staged === true ? '--staged ' : ''}${s.files.join(' ')}`;
        break;
      case 'note':
        break;
      default:
        break;
    }
    out.push({ command, changed, ...repo.snapshot() });
  });
  return out;
}

export async function compile(spec, ctx, issues = new IssueList()) {
  validate(spec, issues);
  if (!issues.ok) return { spec: null, issues };
  const states = simulate(spec.steps, issues);
  const steps = states.map((state, i) => ({ caption: renderText(ctx, spec.steps[i].caption), ...state }));
  return { spec: { kind: 'git-graph', steps }, issues };
}
