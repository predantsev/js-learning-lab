// The same flow, also checking the new habit before the restart.
const add = (name) => [
  { do: 'tap', label: "%%addHabit%%" },
  { do: 'type', label: "%%nameField%%", text: name },
  { do: 'tap', label: "%%save%%" },
];

export const flow = {
  runsOn: 'target',
  steps: [
    { do: 'launch' },
    ...add("%%stretch%%"),
    { do: 'expectVisible', text: "%%stretch%%" },
    { do: 'restart' },
    { do: 'expectVisible', text: "%%stretch%%" },
    { do: 'expectVisible', text: "%%water%%" },
  ],
};
