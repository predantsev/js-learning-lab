// A SYNTHETIC crash report of the expense tracker (read-only), already symbolicated with the
// source map of the same build. "lab-money" is a made-up formatting library.
export const crashReport = {
  app: 'rn07-expenses 1.0.3 (build 41), release',
  device: 'Android 15, emulator',
  error: "TypeError: Cannot read property 'toLocaleString' of undefined",
  stack: [
    'at formatMinor (node_modules/lab-money/format.js:12:28)',
    'at ExpenseRow (src/expenses/ExpenseRow.tsx:31:18)',
    'at renderWithHooks (node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-prod.js:5410:22)',
    'at beginWork (node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-prod.js:8823:16)',
  ],
  breadcrumbs: [
    '10:02:11 %%bOpened%%',
    '10:02:19 %%bTap%%',
    '10:02:20 %%bImported%%',
    '10:02:20 %%bCrash%%',
  ],
};
