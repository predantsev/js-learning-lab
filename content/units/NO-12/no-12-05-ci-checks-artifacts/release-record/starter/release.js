// The release record of a build artifact, and its verification.

export async function createReleaseRecord(artifactPath, { name, version, commit, node }) {
  // TODO: describe the artifact's bytes and write the record next to it
}

export async function verifyRelease(artifactPath) {
  // TODO: compare the artifact with its record; never throw
  return { ok: false, problems: [] };
}
