// Your E2E flow for the habit tracker.
export const flow = {
  runsOn: 'target', // 'host' (Jest on the computer) or 'target' (the declared emulator or device)
  steps: [
    { do: 'launch' },
    { do: 'expectVisible', text: "%%exercise%%" },
    { do: 'tap', label: "%%addHabit%%" },
    { do: 'type', label: "%%nameField%%", text: "%%stretch%%" },
    { do: 'tap', label: "%%save%%" },
    { do: 'restart' },
    { do: 'expectVisible', text: "%%stretch%%" },
  ],
};
