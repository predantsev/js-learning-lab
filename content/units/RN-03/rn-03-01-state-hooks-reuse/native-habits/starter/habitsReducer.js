// habitsReducer.js: shared with the web client. Do not edit.
export function habitsReducer(habits, action) {
  switch (action.type) {
    case 'toggle-active':
      return habits.map((habit) => (habit.id === action.id ? { ...habit, active: !habit.active } : habit));
    case 'remove':
      return habits.filter((habit) => habit.id !== action.id);
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}
