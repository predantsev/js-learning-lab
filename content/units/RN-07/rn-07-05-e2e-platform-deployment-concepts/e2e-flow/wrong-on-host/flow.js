// The right steps, declared to run in Jest on the computer, where no app restarts.
export const flow = {
  runsOn: 'host',
  steps: [
    { do: 'launch' },
    { do: 'tap', label: "%%addHabit%%" },
    { do: 'type', label: "%%nameField%%", text: "%%stretch%%" },
    { do: 'tap', label: "%%save%%" },
    { do: 'restart' },
    { do: 'expectVisible', text: "%%stretch%%" },
  ],
};
