// Builds the static sandbox assets: the frame shell, the runtime and ESM builds of the
// libraries that in-course React / React Native (web preview) exercises may import.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { rolldown } from 'rolldown';
import { esmExternalRequirePlugin } from 'rolldown/plugins';
import { ROOT } from '../server/config.mjs';

const require = createRequire(import.meta.url);
const outDir = path.join(ROOT, 'dist', 'sandbox');
const tmpDir = path.join(ROOT, '.runtime', 'build-sandbox');

// spec → { file, external }. React must exist once, so the other libraries import it by name
// and the sandbox import map points every "react" specifier at the same file.
const LIBS = [
  { spec: 'react', file: 'react.js', external: [] },
  { spec: 'react/jsx-runtime', file: 'react-jsx-runtime.js', external: ['react'] },
  { spec: 'react/jsx-dev-runtime', file: 'react-jsx-dev-runtime.js', external: ['react'] },
  { spec: 'react-dom', file: 'react-dom.js', external: ['react'] },
  { spec: 'react-dom/client', file: 'react-dom-client.js', external: ['react', 'react-dom'] },
  { spec: 'react-native', file: 'react-native.js', source: 'react-native-web', external: ['react', 'react-dom', 'react-dom/client'] },
];

const isIdentifier = (name) => /^[A-Za-z_$][\w$]*$/.test(name) && name !== 'default';

export async function buildSandbox({ quiet = false } = {}) {
  await fs.mkdir(path.join(outDir, 'libs'), { recursive: true });
  await fs.mkdir(tmpDir, { recursive: true });
  // The runtime is inlined: an inline script belongs to the frame's own (opaque) origin, so errors
  // thrown through runtime helpers are reported in full instead of a muted "Script error.".
  const shell = await fs.readFile(path.join(ROOT, 'sandbox', 'frame.html'), 'utf8');
  let runtime = await fs.readFile(path.join(ROOT, 'sandbox', 'runtime.js'), 'utf8');
  // Optional trace collector (defines window.__jsllTrace); see shared/visuals/tracer.js.
  const traceRuntime = await fs.readFile(path.join(ROOT, 'sandbox', 'trace-runtime.js'), 'utf8').catch(() => '');
  if (traceRuntime) runtime = `${traceRuntime}\n${runtime}`;
  const marker = '<script src="/sandbox/runtime.js"></script>';
  if (!shell.includes(marker)) throw new Error('sandbox/frame.html: runtime marker not found');
  await fs.writeFile(path.join(outDir, 'frame.html'), shell.replace(marker, () => `<script>\n${runtime.replace(/<\/script/gi, '<\\/script')}\n</script>`));
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development'; // development builds: readable warnings for learners
  try {
    for (const lib of LIBS) {
      const source = lib.source ?? lib.spec;
      const names = Object.keys(require(source)).filter(isIdentifier);
      const entry = path.join(tmpDir, `${lib.file}.entry.mjs`);
      await fs.writeFile(entry, `import * as M from ${JSON.stringify(source)};\nconst D = M.default ?? M;\nexport default D;\n${names.map((n) => `export const ${n} = M[${JSON.stringify(n)}];`).join('\n')}\n`);
      const bundle = await rolldown({
        input: entry,
        // CommonJS packages `require("react")`; this turns external requires into ESM imports.
        plugins: [esmExternalRequirePlugin({ external: lib.external })],
        platform: 'browser',
        // `global` is the React Native (and Node.js) name of the global object; browsers have only
        // globalThis. react-native-web's Animated drivers call `global.cancelAnimationFrame` when an
        // animation stops, so the libraries get it replaced at build time. Learner code still has
        // no `global`, exactly as in a browser (content/README.md, "Runtimes").
        transform: { define: { 'process.env.NODE_ENV': '"development"', global: 'globalThis' } },
        logLevel: 'silent',
      });
      await bundle.write({ file: path.join(outDir, 'libs', lib.file), format: 'esm', minify: false });
      await bundle.close();
      if (!quiet) console.log(`  sandbox lib ${lib.spec} → libs/${lib.file} (${names.length} exports)`);
    }
  } finally {
    // Assigning undefined would store the string "undefined", and the application build that
    // follows in the same process would then ship React's development build.
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await buildSandbox();
