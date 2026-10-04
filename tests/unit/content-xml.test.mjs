// XML project files (an Android network security config in a React Native lesson): the content
// loader reads them like any text file, project files may be .xml, and the exported project's local
// server answers them as XML (the sandbox's fetch is covered in tests/e2e/runner.test.mjs).
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { newFileProblem } from '../../shared/capstone.js';
import { serveScript } from '../../shared/project-export.js';
import { loadLesson } from '../../scripts/content/lib.mjs';

const CONFIG = '<?xml version="1.0" encoding="utf-8"?>\n<network-security-config>\n  <domain-config cleartextTrafficPermitted="true">\n    <domain includeSubdomains="false">10.0.2.2</domain>\n  </domain-config>\n</network-security-config>\n';

test('the content loader reads .xml files of examples and exercise fixtures', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-xml-'));
  try {
    const xmlPath = 'android/app/src/debug/res/xml/network_security_config.xml';
    for (const rel of [`demo/${xmlPath}`, `task/starter/${xmlPath}`, `task/wrong/${xmlPath}`]) {
      await fs.mkdir(path.join(dir, path.dirname(rel)), { recursive: true });
      await fs.writeFile(path.join(dir, rel), CONFIG);
    }
    await fs.writeFile(path.join(dir, 'demo', 'index.js'), 'console.log(1);\n');
    await fs.writeFile(path.join(dir, 'lesson.yaml'), 'id: rn-06-09-xml\nblocks:\n  - { id: demo, kind: example, dir: demo }\n  - { id: task, kind: exercise, dir: task }\n');
    const lesson = await loadLesson(dir);
    assert.equal(lesson.assets.demo.files[xmlPath], CONFIG);
    assert.equal(lesson.assets.task.starter[xmlPath], CONFIG);
    assert.equal(lesson.assets.task.variants.wrong[xmlPath], CONFIG);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('a project may hold .xml files, and the exported project serves them as XML', () => {
  assert.equal(newFileProblem('res/xml/network_security_config.xml', []), null);
  assert.match(serveScript('en', { restorePath: 'tools/restore-data.html' }), /'\.xml': 'application\/xml; charset=utf-8'/);
});

