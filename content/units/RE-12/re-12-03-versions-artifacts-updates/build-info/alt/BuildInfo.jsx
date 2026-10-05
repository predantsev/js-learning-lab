// version and commit are what the build wrote in; either may be missing ("" or undefined).
export default function BuildInfo({ version, commit }) {
  let text = "%%versionWord%% dev";
  if (version !== undefined && version !== "") {
    text = `%%versionWord%% ${version}`;
    if (commit !== undefined && commit !== "") text += ` (${commit.substring(0, 7)})`;
  }
  return <footer>{text}</footer>;
}
