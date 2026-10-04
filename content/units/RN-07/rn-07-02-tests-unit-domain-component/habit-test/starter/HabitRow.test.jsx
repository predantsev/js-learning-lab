import { test, expect, render, screen, userEvent } from './testing.js';
import { HabitRow } from './HabitRow.jsx';

const habit = { id: 'h-01', name: '%%exercise%%', frequency: 'daily', active: true, completions: ['2026-02-28', '2026-03-01'] };

// Write one test: render the row for 2026-03-02, press the button found by its
// accessible label, and check the status text the user sees.
