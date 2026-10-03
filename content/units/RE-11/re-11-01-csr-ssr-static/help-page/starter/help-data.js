// The data a build step would pass in. A static build renders HelpPage once with these props.
export const helpProps = {
  title: "%%title%%",
  updatedOn: "2026-03-01",
  questions: [
    { id: "q-add", question: "%%qAdd%%", answer: "%%aAdd%%" },
    { id: "q-acquired", question: "%%qAcquired%%", answer: "%%aAcquired%%" },
    { id: "q-storage", question: "%%qStorage%%", answer: "%%aStorage%%" },
  ],
};
