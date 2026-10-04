// Checks the new habit only before any restart: the flow never asks whether it persists.
export const flow = {
  runsOn: 'target',
  steps: [
    { do: 'launch' },
    { do: 'tap', label: "%%addHabit%%" },
    { do: 'type', label: "%%nameField%%", text: "%%stretch%%" },
    { do: 'tap', label: "%%save%%" },
    { do: 'expectVisible', text: "%%stretch%%" },
  ],
};
