// An Xcode build log of an expense tracker (read-only). The bundler part (from "iOS Bundling failed"
// to the code frame) is what `npx expo export --platform ios` really printed for this file, with the
// path shortened; the Xcode lines around it are SYNTHETIC, written in the format Xcode prints.
export const xcodeLog = [
  "CompileSwift normal arm64 /Users/me/rn07-lab/ios/rn07lab/AppDelegate.swift (in target 'rn07lab' from project 'rn07lab')",
  "warning: Run script build phase '[CP-User] [Hermes] Replace Hermes for the right configuration, if needed' will be run during every build because it does not specify any outputs. (in target 'hermes-engine' from project 'Pods')",
  "Ld /Users/me/Library/Developer/Xcode/DerivedData/rn07lab/Build/Products/Debug-iphonesimulator/rn07lab.app/rn07lab normal (in target 'rn07lab' from project 'rn07lab')",
  "PhaseScriptExecution Bundle\\ React\\ Native\\ code\\ and\\ images /Users/me/Library/Developer/Xcode/DerivedData/rn07lab/Build/Intermediates.noindex/rn07lab.build/Script.sh (in target 'rn07lab' from project 'rn07lab')",
  '    cd /Users/me/rn07-lab/ios',
  'iOS Bundling failed 2004ms index.ts (580 modules)',
  'SyntaxError: SyntaxError: /Users/me/rn07-lab/src/expenseTotals.ts: Unexpected token, expected "," (13:71)',
  '  11 |',
  '  12 | export function overallTotal(expenses: Expense[]): number {',
  '> 13 |   return expenses.reduce((sum, expense) => sum + expense.amountMinor, 0;',
  '     |                                                                        ^',
  '  14 | }',
  'Command PhaseScriptExecution failed with a nonzero exit code',
  '** BUILD FAILED **',
  '',
  'The following build commands failed:',
  "\tPhaseScriptExecution Bundle\\ React\\ Native\\ code\\ and\\ images /Users/me/Library/Developer/Xcode/DerivedData/rn07lab/Build/Intermediates.noindex/rn07lab.build/Script.sh (in target 'rn07lab' from project 'rn07lab')",
  '(1 failure)',
];
