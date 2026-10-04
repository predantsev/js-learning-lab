// The ids rscNote may use (read-only).
export const REQUIREMENTS = {
  'bundler-split': 'a bundler that splits the module graph at "use client" and builds server and client bundles',
  'rsc-runtime': 'a framework (or a server or build step) that runs server components and carries their payload to the browser',
  'pinned-react': 'a pinned React version (or Canary): the APIs a bundler uses to implement RSC do not follow semver',
  'react-flag': 'an option in hydrateRoot that switches server components on',
  'nothing-new': 'nothing beyond the node:http server of this unit',
};
export const GAINS = {
  'server-code-out-of-bundle': 'server components and the code they import never reach the client bundle',
  'less-to-hydrate': 'only client components are downloaded and hydrated',
  'no-javascript': 'the page needs no JavaScript at all',
  'no-mismatches': 'hydration mismatches become impossible',
};
