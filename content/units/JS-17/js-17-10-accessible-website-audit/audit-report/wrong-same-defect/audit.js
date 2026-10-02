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
    element: "#habits li:first-child .toggle",
    expectation: "%%f3Expectation%%",
    steps: ["%%f3Step1%%", "%%f3Step2%%"],
    severity: "serious",
    fix: "%%f3Fix%%",
  },
  {
    element: "#saved",
    expectation: "%%f4Expectation%%",
    steps: ["%%f4Step1%%", "%%f4Step2%%"],
    severity: "moderate",
    fix: "%%f4Fix%%",
  },
  {
    element: ".chip",
    expectation: "%%f5Expectation%%",
    steps: ["%%f5Step1%%", "%%f5Step2%%"],
    severity: "serious",
    fix: "%%f5Fix%%",
  },
];
