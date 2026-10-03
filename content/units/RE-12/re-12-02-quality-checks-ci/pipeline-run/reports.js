// Linters, TypeScript and Vite do not run in the browser sandbox. These are their real outputs,
// recorded from release-lab on a computer (oxlint 1.86.0, TypeScript 6.0.3, Vite 8.3.2).
// `ok` is what the command's exit code said: 0 means ok, anything else stops a pipeline.
export const LINT = {
  clean: { ok: true, lines: ["Found 0 warnings and 0 errors."] },
  unusedVariable: {
    ok: true,
    lines: [
      "! eslint(no-unused-vars): Variable 'draft' is declared but never used.",
      "  [src/App.tsx:19:9]",
      "Found 1 warning and 0 errors.",
    ],
  },
};

export const TYPECHECK = {
  clean: { ok: true, lines: [] },
  unusedVariable: { ok: false, lines: ["src/App.tsx(19,9): error TS6133: 'draft' is declared but its value is never read."] },
  wrongArgument: {
    ok: false,
    lines: ["src/App.tsx(27,44): error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'."],
  },
};

export const BUILD = {
  clean: {
    ok: true,
    lines: ["dist/index.html", "dist/assets/index-DGNrK5qb.css", "dist/assets/Stats-DTm_fCmj.js", "dist/assets/index-BIrlHGyo.js"],
  },
};

// Which recording each stage replays in this run. Change these to try another situation.
export const reports = {
  lint: LINT.clean,
  typecheck: TYPECHECK.clean,
  build: BUILD.clean,
};
