// dependencyPaths(lock, name): every chain of packages from the project down to `name`, read from a
// package-lock.json (lockfile version 3, every package installed flat in node_modules/).
export function dependencyPaths(lock, name) {
  const packages = lock.packages;
  const root = packages[''];
  const paths = [];

  function visit(current, chain) {
    if (chain.includes(current)) return; // a cycle: stop
    const next = [...chain, current];
    if (current === name) return paths.push(next);
    const entry = packages[`node_modules/${current}`];
    for (const child of Object.keys(entry?.dependencies ?? {})) visit(child, next);
  }

  for (const direct of Object.keys({ ...root.dependencies, ...root.devDependencies })) visit(direct, []);
  return paths;
}

// Facts about one installed package: its exact version and whether only development tools need it.
export function installed(lock, name) {
  const entry = lock.packages[`node_modules/${name}`];
  return entry ? { version: entry.version, devOnly: entry.dev === true } : null;
}
