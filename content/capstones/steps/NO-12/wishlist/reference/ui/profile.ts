// The Profiler's report: with ?profile in the address (before the #) every commit inside a
// <Profiler id="…" onRender={reportRender}> prints one line in the Console — the id, "mount" or
// "update", and how long React spent rendering the components inside it. Without ?profile it prints
// nothing.
import type { ProfilerOnRenderCallback } from "react";

const ON = new URLSearchParams(location.search).has("profile");

export const reportRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
  if (ON) {
    console.log("profile " + id + " " + phase + " " + actualDuration.toFixed(1) + " ms");
  }
};
