// SIMULATION for the preview only (read-only). It stands in for `git check-ignore` / `git status`
// and for a secret scanner. It understands only the .gitignore forms used here:
// `/dir` and `dir/sub/` or `dir/file` (a slash at the start or in the middle: from the root),
// `dir/` (a folder anywhere), `*.ext`-style globs and plain names.
// Real Git has more rules (negation with !, ** and others).

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]');
  return new RegExp(`^${escaped}$`);
}

function matches(pattern, path) {
  const parts = path.split('/');
  const folderOnly = pattern.endsWith('/');
  const body = pattern.replace(/^\//, '').replace(/\/$/, '');
  if (pattern.startsWith('/') || body.includes('/')) {
    return path.startsWith(`${body}/`) || (!folderOnly && path === body);
  }
  if (folderOnly) return parts.slice(0, -1).includes(body);
  const re = globToRegExp(pattern);
  return parts.some((part) => re.test(part));
}

export function isIgnored(gitignore, path) {
  return gitignore
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .some((pattern) => matches(pattern, path));
}

export function trackedFiles(repo, gitignore) {
  return Object.keys(repo).filter((path) => !isIgnored(gitignore, path)).sort();
}

const KEY_FILE = /\.(keystore|jks|p12|p8|key|pem|mobileprovision)$/;
const PASSWORD_LINE = /^\s*[\w.]*password[\w.]*\s*=\s*\S+/im;

// What a secret scanner would flag among the files Git tracks.
export function scanForSecrets(repo, gitignore) {
  const findings = [];
  for (const path of trackedFiles(repo, gitignore)) {
    if (KEY_FILE.test(path)) findings.push({ path, kind: 'key-file' });
    else if (PASSWORD_LINE.test(repo[path])) findings.push({ path, kind: 'password' });
  }
  return findings;
}
