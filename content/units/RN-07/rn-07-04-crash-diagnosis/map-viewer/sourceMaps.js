// SIMPLIFIED source maps of two builds of the planner. A real map (the .map file that
// `npx expo export --source-maps` writes next to the bundle) stores the same idea compressed:
// "from this column of the bundle on, the code comes from this file, line and function".
export const sourceMaps = {
  b41: [
    { from: 48000, file: 'src/planner/dueLabel.ts', line: 7, name: 'formatDueDate' },
    { from: 51500, file: 'src/planner/TaskRow.tsx', line: 22, name: 'TaskRow' },
    { from: 52400, file: 'src/planner/TaskList.tsx', line: 15, name: 'TaskList' },
    { from: 900000, file: 'node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-prod.js', line: 5410, name: 'renderWithHooks' },
  ],
  b42: [
    { from: 47100, file: 'src/planner/priority.ts', line: 3, name: 'priorityRank' },
    { from: 50900, file: 'src/planner/dueLabel.ts', line: 7, name: 'formatDueDate' },
    { from: 53800, file: 'src/planner/TaskRow.tsx', line: 24, name: 'TaskRow' },
    { from: 899000, file: 'node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-prod.js', line: 5410, name: 'renderWithHooks' },
  ],
};
