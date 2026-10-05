// Prints the whole 40-character commit id instead of its first 7 characters.
export default function BuildInfo({ version, commit }) {
  if (!version) return <footer>%%versionWord%% dev</footer>;
  return <footer>{commit ? `%%versionWord%% ${version} (${commit})` : `%%versionWord%% ${version}`}</footer>;
}
