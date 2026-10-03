// A pretend bundler. Like a real one, it starts at a client entry, follows every static import of a
// project file and collects all the files it reaches — that is what the browser would download.
// Like React Router, it refuses to put a `*.server.*` file into a client bundle.
// It does not minify, tree-shake or follow packages such as "react".
const EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx"];
const IMPORT = /(?:import|export)\s+(?:[^"';]*?\s+from\s+)?["'](\.{1,2}\/[^"']+)["']/g;

export class BuildError extends Error {
  name = "BuildError";
}

async function readProjectFile(path) {
  for (const extension of EXTENSIONS) {
    const response = await fetch(path + extension);
    if (response.ok) return { file: (path + extension).replace(/^\.\//, ""), text: await response.text() };
  }
  throw new BuildError(`cannot resolve ${path}`);
}

export async function bundle(entry) {
  const files = [];
  const seen = new Set();
  async function visit(path, chain) {
    const { file, text } = await readProjectFile(path);
    if (seen.has(file)) return;
    seen.add(file);
    if (/\.server\.[jt]sx?$/.test(file)) {
      throw new BuildError(`${file} is server-only, but the client imports it: ${[...chain, file].join(" → ")}`);
    }
    files.push({ file, text });
    for (const match of text.matchAll(IMPORT)) await visit(`./${match[1].replace(/^\.\//, "")}`, [...chain, file]);
  }
  await visit(entry, []);
  return files;
}
