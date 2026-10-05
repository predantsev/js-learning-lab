// The CP-NO requirements of the wishlist lab, and the words a plan may use.
export const REQUIREMENTS = [
  { id: 'real-requests', text: '%%reqRequests%%' },
  { id: 'restart', text: '%%reqRestart%%' },
  { id: 'client', text: '%%reqClient%%' },
  { id: 'invalid-input', text: '%%reqInvalid%%' },
];

// Where a requirement is implemented.
export const COMPONENTS = ['client-adapter', 'api', 'repository', 'storage'];

// What a check does, in order. A reviewer repeats the steps and compares the evidence.
export const ACTIONS = {
  'request': '%%actRequest%%',
  'read-log': '%%actReadLog%%',
  'stop-server': '%%actStop%%',
  'start-server': '%%actStart%%',
  'reload-page': '%%actReload%%',
};
