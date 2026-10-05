// SIMULATION (read-only): a tiny E2E runner. Real tools (for example Maestro or Detox) drive a real
// app on an emulator or a device; this one drives simDevice.js with the same kind of steps:
// { do: 'launch' }, { do: 'tap', label }, { do: 'type', label, text }, { do: 'restart' },
// { do: 'expectVisible', text }
export function runFlow(flow, device, print = () => {}) {
  const steps = Array.isArray(flow?.steps) ? flow.steps : [];
  if (steps.length === 0) {
    print('%%noSteps%%');
    return false;
  }
  for (const [index, step] of steps.entries()) {
    const name = `${index + 1}. ${step?.do} ${step?.label ?? step?.text ?? ''}`.trim();
    try {
      if (step?.do === 'launch') device.launch();
      else if (step?.do === 'restart') device.restart();
      else if (step?.do === 'tap') device.tap(step.label);
      else if (step?.do === 'type') device.type(step.label, step.text);
      else if (step?.do === 'expectVisible') {
        if (!device.isVisible(step.text)) throw new Error(`"${step.text}" — %%notVisible%%`);
      } else throw new Error(`"${step?.do}" — %%unknownStep%%`);
      print(`✓ ${name}`);
    } catch (error) {
      print(`✗ ${name} — ${error.message}`);
      return false;
    }
  }
  return true;
}
