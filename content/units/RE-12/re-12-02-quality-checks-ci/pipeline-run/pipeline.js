// The course's model of a CI pipeline: stages run one after another, and the first failing stage
// stops the run — the stages after it never start. Each stage returns { ok, lines }.
export async function runPipeline(stages) {
  for (const [index, stage] of stages.entries()) {
    console.log(`▶ ${stage.name}${stage.recorded ? " %%recordedMark%%" : ""}`);
    const { ok, lines } = await stage.run();
    for (const line of lines) {
      if (ok) console.log(`  ${line}`);
      else console.error(`  ${line}`);
    }
    if (!ok) {
      const skipped = stages.slice(index + 1).map((later) => later.name);
      console.error(`✗ ${stage.name} %%stageFailed%%`);
      if (skipped.length > 0) console.log(`%%neverRan%% ${skipped.join(", ")}`);
      return { passed: false, stoppedAt: stage.name, skipped };
    }
    console.log(`✓ ${stage.name}`);
  }
  console.log("%%allPassed%%");
  return { passed: true, stoppedAt: null, skipped: [] };
}
