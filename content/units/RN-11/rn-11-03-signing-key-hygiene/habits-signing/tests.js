import { gitignore, home, note, repo } from './project.js';
import { isIgnored, scanForSecrets } from './simulated-git.js';
import { releaseSigning } from './simulated-gradle.js';

test('no key file or password is tracked by Git', () => {
  expect(scanForSecrets(repo, gitignore), 'findings of the secret scan').toEqual([]);
});

test('no key store sits inside the repository folder', () => {
  const inside = Object.keys(repo).filter((path) => /\.(keystore|jks)$/.test(path));
  expect(inside, 'key stores inside the repository folder').toEqual([]);
});

test('the release signing config still finds the key store and its passwords', () => {
  const signing = releaseSigning(repo, home);
  expect(signing.problem, 'problem reported by the signing config').toBeUndefined();
  expect(signing.ok, 'release signing works').toBe(true);
});

test('the shared Gradle settings stay in the repository', () => {
  const shared = repo['android/gradle.properties'] ?? '';
  expect(shared, 'android/gradle.properties').toContain('org.gradle.jvmargs=');
  expect(shared, 'android/gradle.properties').toContain('newArchEnabled=true');
});

test('.gitignore also ignores any .keystore file', () => {
  expect(isIgnored(gitignore, 'android/app/new-upload.keystore'), 'android/app/new-upload.keystore is ignored').toBe(true);
  expect(isIgnored(gitignore, 'upload.keystore'), 'upload.keystore is ignored').toBe(true);
});

test('the note answers all four questions, with a backup somewhere else', () => {
  for (const field of ['keyLocation', 'backup', 'ignored', 'ifLeaked']) {
    expect(typeof note[field] === 'string' && note[field].trim().length > 0, `note.${field} is filled in`).toBe(true);
  }
  expect(note.backup.trim() === note.keyLocation.trim(), 'the backup is the key location itself').toBe(false);
});
