// Treats only undefined as "missing": an empty version from the build prints "Version ".
export default function BuildInfo({ version, commit }) {
  if (version === undefined) return <footer>%%versionWord%% dev</footer>;
  return <footer>{commit === undefined ? `%%versionWord%% ${version}` : `%%versionWord%% ${version} (${commit.slice(0, 7)})`}</footer>;
}
