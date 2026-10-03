// Forgets that the commit may be missing: optional chaining turns it into "(undefined)".
export default function BuildInfo({ version, commit }) {
  if (!version) return <footer>%%versionWord%% dev</footer>;
  return <footer>{`%%versionWord%% ${version} (${commit?.slice(0, 7)})`}</footer>;
}
