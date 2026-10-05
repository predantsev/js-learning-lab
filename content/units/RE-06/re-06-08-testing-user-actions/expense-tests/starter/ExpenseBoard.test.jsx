import { test, expect, render, screen, user } from "./testing.js";
import { settings } from "./fakeServer.js";
import ExpenseBoard from "./ExpenseBoard";

// Write two tests that act like a person and check only what is on the screen:
// 1. adding an expense through the form shows it in the list;
// 2. a failed save shows the error message and leaves the list unchanged.
