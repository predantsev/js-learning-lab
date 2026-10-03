// version and commit are what the build wrote in; either may be missing ("" or undefined).
export default function BuildInfo({ version, commit }) {
  if (!version) {
    return <footer>%%versionWord%% dev</footer>;
  }
  const shortCommit = commit ? ` (${commit.slice(0, 7)})` : "";
  return (
    <footer>
      %%versionWord%% {version}
      {shortCommit}
    </footer>
  );
}
