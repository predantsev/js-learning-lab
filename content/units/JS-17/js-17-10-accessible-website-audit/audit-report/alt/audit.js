// Your audit report: five findings, each about a different problem of this page.
// severity is one of "critical", "serious", "moderate", "minor".
export const findings = [
  {
    element: "#search",
    expectation: "%%f1Expectation%%",
    steps: ["%%f1Step1%%", "%%f1Step2%%", "%%f1Step3%%"],
    severity: "critical",
    fix: "%%f1Fix%%",
  },
  {
    element: "#habits .toggle",
    expectation: "%%f2Expectation%%",
    steps: ["%%f2Step1%%", "%%f2Step2%%"],
    severity: "critical",
    fix: "%%f2Fix%%",
  },
  {
    element: "#add-habit",
    expectation: "%%f3Expectation%%",
    steps: ["%%f3Step1%%", "%%f3Step2%%"],
    severity: "serious",
    fix: "%%f3Fix%%",
  },
  {
    element: "#habit-name",
    expectation: "%%f6Expectation%%",
    steps: ["%%f6Step1%%", "%%f6Step2%%"],
    severity: "serious",
    fix: "%%f6Fix%%",
  },
  {
    element: "header a",
    expectation: "%%f7Expectation%%",
    steps: ["%%f7Step1%%", "%%f7Step2%%"],
    severity: "moderate",
    fix: "%%f7Fix%%",
  },
];
